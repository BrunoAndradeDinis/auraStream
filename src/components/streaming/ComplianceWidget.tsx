'use client';
import { TrackInfo, StreamStatus } from '@/types/shared';

export function ComplianceWidget({ queue, status }: { queue: TrackInfo[], status: StreamStatus }) {
  const isBlocked = status === 'compliance_blocked';
  const unverified = queue.filter((t) => t.isVerified === false); // Only tracks explicitly marked false

  if (isBlocked) {
    return (
      <div className="glass-card" style={{ border: '1px solid #EF4444', transition: 'all 300ms ease-in-out' }}>
        <div className="flex flex-col gap-2">
          <span style={{ color: '#EF4444' }} className="font-bold font-outfit">❌ BLOCKED: Non-NCS source detected</span>
          <a href="https://ncs.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }} className="text-sm hover:underline">
            Fix Now →
          </a>
        </div>
      </div>
    );
  }

  if (unverified.length > 0) {
    return (
      <div className="glass-card" style={{ border: '1px solid #F59E0B', transition: 'all 300ms ease-in-out' }}>
        <div className="flex flex-col gap-2">
          <span style={{ color: '#F59E0B' }} className="font-bold font-outfit">⚠️ {unverified.length} tracks unverified</span>
          <ul className="text-xs text-muted font-mono list-disc list-inside">
            {unverified.map((t) => <li key={t.id} className="truncate">{t.filename}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ border: '1px solid #10B981', transition: 'all 300ms ease-in-out' }}>
      <span style={{ color: '#10B981' }} className="font-bold font-outfit flex items-center gap-2">
        <span>✅</span> All tracks verified
      </span>
    </div>
  );
}
