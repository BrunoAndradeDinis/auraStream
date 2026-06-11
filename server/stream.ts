import puppeteer, { Browser } from 'puppeteer';
import { launch, getStream } from 'puppeteer-stream';
import { spawn, ChildProcess } from 'child_process';
import { state, setState } from './state';
import { broadcast, broadcastEvent } from './broadcast';

let ffmpegProcess: ChildProcess | null = null;
let activeBrowser: Browser | null = null;

let reconnectAttempts = 0;
const MAX_ATTEMPTS = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isStopped = false;

export async function startStream(streamKey: string): Promise<void> {
  if (ffmpegProcess) {
    console.warn('[stream] FFmpeg process already running');
    return;
  }

  isStopped = false;

  activeBrowser = (await launch({ 
    executablePath: await puppeteer.executablePath(),
    headless: false, 
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--autoplay-policy=no-user-gesture-required'
    ],
    defaultViewport: { width: 1920, height: 1080 } 
  })) as unknown as Browser;
  
  const page = await activeBrowser!.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:9002/dashboard');

  // @ts-expect-error — puppeteer-stream type mismatch
  const stream = await getStream(page, { audio: true, video: true });

  const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
  ffmpegProcess = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', '3500k',
    '-maxrate', '3500k', '-bufsize', '7000k',
    '-s', '1920x1080', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k',
    '-f', 'flv', rtmpUrl,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  stream.pipe(ffmpegProcess.stdin!);
  console.log('[stream] FFmpeg process started with Puppeteer');
  setState({ status: 'streaming' });
  broadcast();

  ffmpegProcess.stderr?.on('data', (data) => {
    // console.log(`[ffmpeg] ${data.toString()}`);
  });

  ffmpegProcess.on('error', (err) => {
    console.error('[stream] FFmpeg error:', err.message);
    handleStreamDrop();
  });

  ffmpegProcess.on('close', (code) => {
    console.log(`[stream] FFmpeg closed with code ${code}`);
    if (code !== 0) handleStreamDrop();
  });

  reconnectAttempts = 0;
}

export function writeStreamChunk(chunk: Buffer): void {
  // Mantido por retrocompatibilidade se for usado via WS
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
      if (ffmpegProcess) stopStream(true);
      await startStream(state.streamKey!);
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
    const process = ffmpegProcess;
    ffmpegProcess = null;

    await new Promise<void>((resolve) => {
      process.kill('SIGTERM');
      const killTimeout = setTimeout(() => {
        process.kill('SIGKILL');
        resolve();
      }, 5000);
      process.on('close', () => {
        clearTimeout(killTimeout);
        resolve();
      });
    });
    console.log('[stream] FFmpeg process stopped');
  }
  
  if (activeBrowser) {
    activeBrowser.close().catch(() => {});
    activeBrowser = null;
  }

  if (!skipCancel) {
    setState({ status: 'offline' });
    broadcast();
  }
}

export async function restartStream(streamKey: string): Promise<void> {
  await stopStream();
  isStopped = false;
  reconnectAttempts = 0;
  await startStream(streamKey);
}
