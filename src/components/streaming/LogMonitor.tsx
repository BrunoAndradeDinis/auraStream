'use client';
import { useState, useCallback, useEffect } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  isCompliance?: boolean;
}

export function LogMonitor({ onRegisterAddLog }: { onRegisterAddLog: (addLog: (entry: Omit<LogEntry, 'id'>) => void) => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLogs((prev) => [
      { ...entry, id: crypto.randomUUID() },
      ...prev.slice(0, 19), // mantém max 20
    ]);
  }, []);

  // Expor addLog para o parent via callback
  useEffect(() => { 
    onRegisterAddLog(addLog); 
  }, [onRegisterAddLog, addLog]);

  const ICONS = { INFO: '✅', WARNING: '⚠️', ERROR: '❌' };
  const COLORS = { INFO: 'var(--color-text)', WARNING: '#F59E0B', ERROR: '#EF4444' };

  return (
    <div className="glass-card flex flex-col h-64">
      <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
        <h3 className="text-xl font-bold font-outfit text-white">System Logs</h3>
        <button 
          onClick={() => setLogs([])}
          className="btn-secondary text-xs py-1 px-3"
        >
          Clear
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-1">
        {logs.length === 0 && (
          <div className="text-muted text-xs font-mono text-center mt-4">Waiting for events...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} style={{
            color: log.isCompliance ? '#F59E0B' : COLORS[log.level],
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }} className="border-b border-border/20 pb-1 break-words">
            <span className="mr-2">{ICONS[log.level]}</span>
            <span className="text-muted mr-2">[{log.timestamp}]</span> 
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
