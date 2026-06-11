'use client';
import { useState, useRef } from 'react';

export function StreamConfigCard({ onSend, sendBinary }: { onSend: (event: string, payload: unknown) => void, sendBinary?: (blob: Blob) => void }) {
  const [bitrate, setBitrate] = useState(3500);
  const [resolution, setResolution] = useState('1080p');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp8,opus' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && sendBinary) sendBinary(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsCapturing(true);

      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err) {
      console.error('Failed to capture:', err);
    }
  };

  const stopCapture = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    setIsCapturing(false);
  };

  const handleKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const key = (e.currentTarget.elements.namedItem('streamKey') as HTMLInputElement).value;
    if (key) {
      onSend('config:stream_key', key);
    }
    setTimeout(() => setIsSubmitting(false), 500);
  };

  return (
    <div className="glass-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold font-outfit text-white">Stream Config</h3>
        <button 
          onClick={isCapturing ? stopCapture : startCapture}
          className={`btn-primary ${isCapturing ? 'bg-destructive' : ''}`}
          style={isCapturing ? { backgroundColor: 'var(--destructive)', color: 'white' } : {}}
        >
          {isCapturing ? 'Parar Captura' : 'Transmissão Manual'}
        </button>
      </div>
      <form onSubmit={handleKeySubmit} className="flex flex-col gap-2 mb-6">
        <label className="text-sm text-muted">YouTube Stream Key</label>
        <div className="flex gap-2">
          <input 
            type="password" 
            name="streamKey" 
            placeholder="●●●●●●●●●●●●●●●" 
            autoComplete="off" 
            style={{ color: 'white', backgroundColor: '#020617' }}
            className="flex-1 border border-border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
          />
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Set...' : 'Set Key'}
          </button>
        </div>
      </form>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm text-muted">Bitrate</label>
            <span style={{ fontFamily: 'var(--font-mono)' }} className="text-primary font-bold text-sm">
              {bitrate} kbps
            </span>
          </div>
          <input 
            type="range" 
            min={1500} 
            max={8000} 
            step={100} 
            value={bitrate} 
            onChange={(e) => setBitrate(+e.target.value)} 
            className="w-full accent-primary h-2 bg-surface rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm text-muted">Resolution</label>
          <select 
            value={resolution} 
            onChange={(e) => setResolution(e.target.value)}
            style={{ color: 'white', backgroundColor: '#020617' }}
            className="border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="1080p">1080p (60fps)</option>
            <option value="720p">720p (60fps)</option>
            <option value="480p">480p (30fps)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
