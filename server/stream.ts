import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import puppeteer, { Browser } from 'puppeteer';
import { state, setState } from './state';
import { broadcast, broadcastEvent } from './broadcast';

let ffmpegProcess: ChildProcess | null = null;
let audioDecoderProcess: ChildProcess | null = null;
let activeBrowser: Browser | null = null;

let reconnectAttempts = 0;
const MAX_ATTEMPTS = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isStopped = false;
let activeStreamKey: string | null = null;

/**
 * Resolve the absolute path of the current track's audio file.
 * Falls back to the first queue item if currentTrack is null.
 */
function resolveAudioPath(): string | null {
  const track = state.currentTrack ?? state.queue[0] ?? null;
  if (!track) return null;
  // track.path is already absolute (set by watcher/queue loader)
  return track.path;
}

/**
 * Query the real dimensions of the current X11 display using xdpyinfo.
 * Falls back to 1920x1080 if xdpyinfo is unavailable or fails.
 */
function getDisplaySize(): { width: number; height: number } {
  try {
    const display = process.env.DISPLAY || ':99';
    const out = execSync(`xdpyinfo -display ${display} 2>/dev/null | grep dimensions`, {
      timeout: 3000,
      encoding: 'utf8',
    });
    // Line looks like: "  dimensions:    1280x1024 pixels (..)"
    const match = out.match(/(\d+)x(\d+)\s+pixels/);
    if (match) {
      const w = parseInt(match[1], 10);
      const h = parseInt(match[2], 10);
      console.log(`[stream] Detected display size: ${w}x${h}`);
      return { width: w, height: h };
    }
  } catch {
    // xdpyinfo not installed or failed — use safe default
  }
  console.warn('[stream] Could not detect display size, defaulting to 1920x1080');
  return { width: 1920, height: 1080 };
}

/**
 * Build the FFmpeg argv for streaming to YouTube RTMP.
 *
 * Video source: x11grab on $DISPLAY (Xvfb virtual display).
 *   - Captures at the ACTUAL display size to avoid "outside screen" error.
 *   - Scales to 1920x1080 via -vf scale for YouTube compatibility.
 * Audio source: the current track's MP3 file read at 1× speed.
 *
 * When the MP3 ends, FFmpeg exits with code 0 and onTrackEnded() is
 * called to advance the queue and restart for the next track.
 */
function buildFFmpegArgs(rtmpUrl: string): string[] {
  const display = process.env.DISPLAY || ':99';
  const { width, height } = getDisplaySize();
  const captureSize = `${width}x${height}`;
  // Only add scale filter if the captured size differs from 1920x1080
  const needsScale = width !== 1920 || height !== 1080;
  const vf = needsScale ? 'scale=1920:1080' : undefined;

  return [
    // ── Video input: X11 virtual display ──────────────────────────────
    '-draw_mouse', '0',           // Remove mouse cursor from stream
    '-f', 'x11grab',
    '-framerate', '30',
    '-video_size', captureSize,
    '-i', display,

    // ── Audio input: Raw PCM stream from stdin (so it never drops) ────
    '-f', 's16le',
    '-ar', '44100',
    '-ac', '2',
    '-i', 'pipe:0',

    // ── Video encode ──────────────────────────────────────────────────
    '-c:v', 'libx264',
    '-preset', 'ultrafast',       // Ultrafast for minimal CPU load
    '-tune', 'zerolatency',
    '-b:v', '3500k',
    '-maxrate', '3500k',
    '-bufsize', '7000k',
    ...(vf ? ['-vf', vf] : []),   // scale to 1920x1080 if needed
    '-s', '1920x1080',
    '-r', '30',
    '-g', '60',                   // keyframe every 2 s at 30 fps

    // ── Audio encode ──────────────────────────────────────────────────
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',

    // ── Output: RTMP FLV ──────────────────────────────────────────────
    '-f', 'flv',
    rtmpUrl,
  ];
}

/**
 * Ensures a Chrome browser is running in the X11 display, pointing to our dashboard.
 * Without this, x11grab would just capture a black screen.
 */
async function ensureBrowserReady(): Promise<void> {
  if (activeBrowser) return;

  console.log('[stream] Launching browser to render UI on Xvfb...');
  try {
    activeBrowser = await puppeteer.launch({
      executablePath: await puppeteer.executablePath(),
      headless: false, // MUST be false to render on Xvfb
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--autoplay-policy=no-user-gesture-required',
        '--start-fullscreen',
        '--kiosk',
        '--window-position=0,0',
        '--window-size=1920,1080',
        '--hide-scrollbars',
        '--disable-infobars',
        '--disable-accelerated-video-decode',
        '--disable-features=AudioServiceOutOfProcess'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await activeBrowser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // The UI must be running on localhost:9002
    await page.goto('http://localhost:9002/?stream_client=true', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    console.log('[stream] Browser is ready and displaying UI.');
  } catch (err) {
    console.error('[stream] Error launching browser:', (err as Error).message);
    if (activeBrowser) {
      await activeBrowser.close().catch(() => {});
      activeBrowser = null;
    }
    throw err;
  }
}

/**
 * Spawns an FFmpeg decoder for a specific MP3 track and pipes its raw PCM
 * audio to the continuous main FFmpeg process.
 */
function startAudioDecoder(audioPath: string): void {
  if (audioDecoderProcess) {
    const oldProcess = audioDecoderProcess;
    audioDecoderProcess = null;
    oldProcess.removeAllListeners('close');
    oldProcess.kill('SIGKILL');
  }

  console.log(`[stream] Starting audio decoder for: ${path.basename(audioPath)}`);

  const p = spawn('ffmpeg', [
    '-v', 'error',
    '-i', audioPath,
    '-f', 's16le',
    '-ar', '44100',
    '-ac', '2',
    'pipe:1'
  ], {
    stdio: ['ignore', 'pipe', 'inherit']
  });

  audioDecoderProcess = p;

  if (ffmpegProcess && ffmpegProcess.stdin && p.stdout) {
    // Handle EPIPE on stdout if main ffmpeg dies suddenly
    p.stdout.on('error', (err: any) => {
      if (err.code !== 'EPIPE') console.error('[stream] Decoder stdout error:', err.message);
    });

    // Pipe PCM to main FFmpeg stdin. `end: false` prevents closing stdin when decoder finishes.
    p.stdout.pipe(ffmpegProcess.stdin, { end: false });
  }

  p.on('error', (err) => {
    console.error('[stream] Audio decoder error:', err.message);
  });

  p.on('close', (code) => {
    if (audioDecoderProcess === p) {
      audioDecoderProcess = null;
      console.log(`[stream] Audio decoder finished (code ${code})`);
      if (!isStopped) {
        onTrackEnded();
      }
    }
  });
}

export function playCurrentTrackAudio(): void {
  if (isStopped || !activeStreamKey) return;
  const newPath = resolveAudioPath();
  if (newPath) {
    startAudioDecoder(newPath);
  } else {
    console.warn('[stream] No audio path resolved for the next track');
  }
}

export async function startStream(streamKey: string): Promise<void> {
  if (ffmpegProcess) {
    console.warn('[stream] FFmpeg process already running');
    return;
  }

  isStopped = false;
  activeStreamKey = streamKey;

  const audioPath = resolveAudioPath();
  if (!audioPath) {
    throw new Error('No track in queue to stream audio from');
  }

  // Ensure UI is being rendered on the virtual display BEFORE starting capture
  await ensureBrowserReady();

  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  const args = buildFFmpegArgs(rtmpUrl);

  console.log(`[stream] Starting Main FFmpeg Process...`);
  console.log(`[stream] DISPLAY=${process.env.DISPLAY || ':99'}`);

  ffmpegProcess = spawn('ffmpeg', args, {
    stdio: ['pipe', 'pipe', 'pipe'], // stdin MUST be pipe for raw PCM audio
  });

  if (ffmpegProcess.stdin) {
    ffmpegProcess.stdin.on('error', (err: any) => {
      if (err.code !== 'EPIPE') console.error('[stream] Main FFmpeg stdin error:', err.message);
    });
  }

  ffmpegProcess.stdout?.on('data', (data) => {
    process.stdout.write(`[ffmpeg:out] ${data}`);
  });

  ffmpegProcess.stderr?.on('data', (data) => {
    process.stdout.write(`[ffmpeg] ${data}`);
  });

  ffmpegProcess.on('error', (err) => {
    console.error('[stream] FFmpeg spawn error:', err.message);
    ffmpegProcess = null;
    handleStreamDrop();
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[stream] FFmpeg closed with code ${code}`);
    ffmpegProcess = null;

    if (isStopped) return;
    
    // Main FFmpeg should not close naturally. If it does, there's an error/network drop.
    handleStreamDrop();
  });

  setState({ status: 'streaming' });
  broadcast();
  reconnectAttempts = 0;
  console.log('[stream] Main FFmpeg process started. Waiting for audio...');
  
  // Start the first audio track
  startAudioDecoder(audioPath);
}

/**
 * Called when FFmpeg exits with code 0 (track finished).
 * Advances the queue and restarts FFmpeg for the next track.
 */
function onTrackEnded(): void {
  if (isStopped || !activeStreamKey) return;

  const queue = state.queue;
  if (queue.length === 0) {
    console.log('[stream] Queue empty after track ended — stopping stream');
    setState({ status: 'idle' });
    broadcast();
    return;
  }

  // Use the central compliance logic from server.ts to advance track
  import('./server').then(m => {
    if (state.currentTrack) {
      m.advanceToNextValidTrack(state.currentTrack.id);
    } else {
      m.advanceToNextValidTrack(null);
    }
    broadcastEvent('media:skip', {});
    
    // Play the newly advanced track
    playCurrentTrackAudio();
  }).catch(err => {
    console.error('[stream] Failed to advance track dynamically:', err);
  });
}

/** @deprecated kept for backward compatibility via WebSocket binary chunks */
export function writeStreamChunk(chunk: Buffer): void {
  if (ffmpegProcess && ffmpegProcess.stdin && !ffmpegProcess.stdin.destroyed) {
    ffmpegProcess.stdin.write(chunk);
  }
}

function handleStreamDrop(): void {
  if (isStopped) return;

  if (reconnectAttempts >= MAX_ATTEMPTS) {
    setState({ status: 'offline' });
    broadcast();
    broadcastEvent('server:stream_failed', null);
    return;
  }

  reconnectAttempts++;
  const delay = Math.pow(2, reconnectAttempts) * 1000;
  console.log(`[stream] reconnect attempt ${reconnectAttempts}/${MAX_ATTEMPTS} in ${delay}ms`);
  setState({ status: 'reconnecting' });
  broadcast();

  reconnectTimeout = setTimeout(async () => {
    if (isStopped) return;
    try {
      await startStream(activeStreamKey ?? state.streamKey!);
    } catch {
      handleStreamDrop();
    }
  }, delay);
}

export function cancelReconnect(): void {
  isStopped = true;
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = null;
  reconnectAttempts = 0;
}

export async function stopStream(skipCancel = false): Promise<void> {
  if (!skipCancel) cancelReconnect();

  if (audioDecoderProcess) {
    audioDecoderProcess.kill('SIGKILL');
    audioDecoderProcess = null;
  }

  if (ffmpegProcess) {
    const proc = ffmpegProcess;
    ffmpegProcess = null;

    await new Promise<void>((resolve) => {
      proc.kill('SIGTERM');
      const killTimeout = setTimeout(() => {
        proc.kill('SIGKILL');
        resolve();
      }, 5000);
      proc.on('close', () => {
        clearTimeout(killTimeout);
        resolve();
      });
    });

    console.log('[stream] FFmpeg process stopped');
  }

  if (!skipCancel) {
    if (activeBrowser) {
      await activeBrowser.close().catch(() => {});
      activeBrowser = null;
      console.log('[stream] Browser closed');
    }

    activeStreamKey = null;
    setState({ status: 'offline' });
    broadcast();
  }
}

export async function restartStream(streamKey: string): Promise<void> {
  await stopStream(true);
  isStopped = false;
  reconnectAttempts = 0;
  activeStreamKey = streamKey;
  await startStream(streamKey);
}
