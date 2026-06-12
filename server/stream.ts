import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import { state, setState } from './state';
import { broadcast, broadcastEvent } from './broadcast';

let ffmpegProcess: ChildProcess | null = null;

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
function buildFFmpegArgs(rtmpUrl: string, audioPath: string): string[] {
  const display = process.env.DISPLAY || ':99';
  const { width, height } = getDisplaySize();
  const captureSize = `${width}x${height}`;
  // Only add scale filter if the captured size differs from 1920x1080
  const needsScale = width !== 1920 || height !== 1080;
  const vf = needsScale ? 'scale=1920:1080' : undefined;

  return [
    // ── Video input: X11 virtual display ──────────────────────────────
    '-f', 'x11grab',
    '-framerate', '30',
    '-video_size', captureSize,
    '-i', display,

    // ── Audio input: MP3 file ─────────────────────────────────────────
    '-i', audioPath,

    // ── Video encode ──────────────────────────────────────────────────
    '-c:v', 'libx264',
    '-preset', 'veryfast',
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

  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  const args = buildFFmpegArgs(rtmpUrl, audioPath);

  console.log(`[stream] Starting FFmpeg — audio: ${path.basename(audioPath)}`);
  console.log(`[stream] DISPLAY=${process.env.DISPLAY || ':99'}`);

  ffmpegProcess = spawn('ffmpeg', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

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

    if (code === 0) {
      // Track finished naturally — advance queue and start next track
      onTrackEnded();
    } else {
      handleStreamDrop();
    }
  });

  setState({ status: 'streaming' });
  broadcast();
  reconnectAttempts = 0;
  console.log('[stream] FFmpeg process started (x11grab + file audio)');
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

  // Find next track after currentTrack
  const currentIndex = state.currentTrack
    ? queue.findIndex((t) => t.id === state.currentTrack!.id)
    : -1;
  const nextIndex = (currentIndex + 1) % queue.length;
  const nextTrack = queue[nextIndex];

  console.log(`[stream] Track ended — advancing to: ${nextTrack.filename}`);
  setState({ currentTrack: nextTrack });
  broadcast();
  broadcastEvent('media:skip', {});

  // Small delay to let state propagate
  setTimeout(async () => {
    if (isStopped || !activeStreamKey) return;
    try {
      await startStream(activeStreamKey!);
    } catch (err) {
      console.error('[stream] Failed to start next track:', (err as Error).message);
      handleStreamDrop();
    }
  }, 500);
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
