'use client';
import { useEffect, useState } from 'react';
import { StreamStatus } from '@/types/shared';

const STATUS_CONFIG = {
  streaming: { color: '#10B981', label: '● LIVE', pulse: true },
  reconnecting: { color: '#F59E0B', label: '● RECONNECTING', pulse: true },
  idle: { color: '#EF4444', label: '● OFFLINE', pulse: false },
  offline: { color: '#EF4444', label: '● OFFLINE', pulse: false },
  paused: { color: '#F59E0B', label: '● PAUSED', pulse: false },
  compliance_blocked: { color: '#EF4444', label: '● BLOCKED', pulse: false },
};

export function LiveStatusCard({ status }: { status: StreamStatus }) {
  const [uptime, setUptime] = useState(0); // segundos
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;

  useEffect(() => {
    if (status !== 'streaming') { setUptime(0); return; }
    const interval = setInterval(() => setUptime((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  return (
    <div className="bg-surface/50 border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-1 shadow-lg" style={{ transition: 'all 300ms ease-in-out' }}>
      <div style={{ color: cfg.color, fontWeight: 700 }} className={cfg.pulse ? 'pulse' : ''}>
        {cfg.label}
      </div>
      {status === 'streaming' ? (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: '12px', marginTop: '4px' }}>
          {formatUptime(uptime)}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', fontSize: '12px', marginTop: '4px' }}>
          00:00:00
        </div>
      )}
    </div>
  );
}
