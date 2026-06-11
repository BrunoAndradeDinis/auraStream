'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LiveStatusCard } from '@/components/streaming/LiveStatusCard';
import { AppState } from '@/types/shared';
import { AuroraBackground } from '@/components/streaming/AuroraBackground';

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function DashboardLayout({ children, appState }: { children: React.ReactNode, appState: AppState }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg)' }}>
      <AuroraBackground />
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-surface text-primary rounded-lg border border-border"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <Sidebar isOpen={isSidebarOpen} appState={appState} />
      
      <main style={{
        flex: 1,
        padding: 'var(--padding-comfortable)',
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
      }}>
        {children}
      </main>
    </div>
  );
}

function Sidebar({ isOpen, appState }: { isOpen: boolean, appState: AppState }) {
  return (
    <aside 
      className={`fixed md:relative z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      style={{
        width: '240px',
        height: '100vh',
        flexShrink: 0,
        background: 'rgba(2, 6, 23, 0.95)',
        borderRight: '1px solid var(--color-border)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ fontFamily: 'var(--font-outfit)', fontWeight: 700, color: 'var(--color-primary)', fontSize: '18px' }}>
        AuraStream
      </div>
      <LiveStatusCard status={appState.status} />
      {appState.shutdownCountdown && appState.shutdownCountdown > 0 && (
        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--color-primary)', fontSize: '11px', marginTop: '8px' }}>
          ⏱ {formatUptime(appState.shutdownCountdown)}
        </div>
      )}
      {/* Cards da sidebar adicionados nas Stories 4.8 */}
    </aside>
  );
}
