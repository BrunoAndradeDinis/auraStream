'use client';
import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/streaming/Dashboard';
import { StreamConfigCard } from '@/components/streaming/StreamConfigCard';
import { NowPlayingCard } from '@/components/streaming/NowPlayingCard';
import { TrackInfo, AppState } from '@/types/shared';
import { QueueList } from '@/components/streaming/QueueList';
import { LogMonitor, LogEntry } from '@/components/streaming/LogMonitor';
import { ComplianceWidget } from '@/components/streaming/ComplianceWidget';
import { useWebSocket } from '@/hooks/use-websocket';

import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { toast } = useToast();
  const [appState, setAppState] = useState<AppState>({
    status: 'idle',
    currentTrack: null,
    queue: [],
  });

  const addLogRef = useRef<((entry: Omit<LogEntry, 'id'>) => void) | null>(null);

  const handleMessage = useCallback((event: string, payload: unknown) => {
    if (event === 'server:state_sync') {
      const newState = payload as AppState;
      setAppState(newState);
    }
    
    if (event === 'server:shutdown_warning') {
      toast({
        title: "Auto-Shutdown",
        description: "⚠️ Stream shutting down in 5 minutes",
        variant: "destructive",
      });
    }

    // Add logs based on events
    if (addLogRef.current) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
      if (event === 'server:state_sync') {
        // addLogRef.current({ timestamp, level: 'INFO', message: 'State synced' }); // Might be too spammy if frequent
      } else if (event === 'server:compliance_skip') {
        addLogRef.current({ timestamp, level: 'WARNING', message: 'Compliance skip triggered', isCompliance: true });
      } else if (event === 'server:stream_failed') {
        addLogRef.current({ timestamp, level: 'ERROR', message: 'Stream failed' });
      } else if (event === 'player:track_changed') {
        addLogRef.current({ timestamp, level: 'INFO', message: 'Track changed' });
      }
    }
  }, [toast]);

  const { send, sendBinary, isConnected } = useWebSocket(handleMessage);

  const handleSend = (event: string, payload: unknown) => {
    send(event, payload);
    
    if (addLogRef.current && event !== 'config:stream_key') {
      addLogRef.current({
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: 'INFO',
        message: `Sent: ${event}`
      });
    }

    if (event === 'queue:reorder') {
      const payloadData = payload as { newOrder: string[] };
      setAppState(prev => {
        const newQueue = [...prev.queue];
        newQueue.sort((a, b) => payloadData.newOrder.indexOf(a.id) - payloadData.newOrder.indexOf(b.id));
        return { ...prev, queue: newQueue };
      });
    }
  };

  return (
    <>
      {!isConnected && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: '#F59E0B', color: '#000', textAlign: 'center', padding: '8px',
          fontFamily: 'var(--font-outfit)', fontWeight: 600,
        }}>
          ⚠️ Connection lost — retrying...
        </div>
      )}
      <DashboardLayout appState={appState}>
        <div className="flex flex-col gap-6 max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold font-outfit text-white">Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <ComplianceWidget queue={appState.queue} status={appState.status} />
              <NowPlayingCard currentTrack={appState.currentTrack} />
              <StreamConfigCard onSend={handleSend} sendBinary={sendBinary} />
              <LogMonitor onRegisterAddLog={(cb) => { addLogRef.current = cb; }} />
            </div>
            
            <div className="lg:col-span-1">
              <QueueList 
                queue={appState.queue} 
                currentTrackId={appState.currentTrack?.id || null} 
                onReorder={(newOrder) => handleSend('queue:reorder', { newOrder })} 
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
