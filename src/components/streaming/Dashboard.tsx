"use client"

import React, { useState } from 'react';
import { 
  Activity, 
  Settings, 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Plus, 
  ListMusic,
  Monitor,
  Cpu,
  Database,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
}

interface DashboardProps {
  tracks: Track[];
  currentTrackId: string;
  isStreaming: boolean;
  onToggleStream: () => void;
  onSelectTrack: (id: string) => void;
  onGenerateDescription: (track: Track) => void;
  isGenerating: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tracks,
  currentTrackId,
  isStreaming,
  onToggleStream,
  onSelectTrack,
  onGenerateDescription,
  isGenerating
}) => {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="p-6 h-screen flex flex-col gap-6 bg-background/95 border-r border-border/50 max-w-md w-full relative z-10 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-headline font-bold text-white tracking-tight">AuraStream</h1>
            <div className="flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", isStreaming ? "bg-green-500 animate-pulse" : "bg-zinc-600")} />
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Control Dashboard v1.0</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="bg-secondary/30 border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <Cpu className="w-4 h-4 text-accent" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">CPU Load</p>
              <p className="text-lg font-headline font-bold text-white">12.4%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/30 border-border/50">
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Memory</p>
              <p className="text-lg font-headline font-bold text-white">420MB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ListMusic className="w-4 h-4" />
            Live Queue
          </h3>
          <Badge variant="outline" className="border-primary/30 text-primary">{tracks.length} Tracks</Badge>
        </div>
        
        <ScrollArea className="h-[calc(100vh-500px)] rounded-xl border border-border/50 bg-secondary/10 p-2">
          <div className="space-y-1">
            {tracks.map((track) => (
              <div 
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={cn(
                  "group p-3 rounded-lg flex items-center justify-between transition-all cursor-pointer",
                  currentTrackId === track.id 
                    ? "bg-primary/10 border border-primary/20" 
                    : "hover:bg-secondary/40 border border-transparent"
                )}
              >
                <div className="min-w-0 pr-4">
                  <p className={cn(
                    "text-sm font-bold truncate",
                    currentTrackId === track.id ? "text-primary" : "text-white group-hover:text-primary/80"
                  )}>
                    {track.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase">{track.artist}</p>
                </div>
                {currentTrackId === track.id && (
                  <Badge variant="secondary" className="bg-primary text-white text-[9px] h-5">PLAYING</Badge>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateDescription(track);
                  }}
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto space-y-4 bg-secondary/40 p-5 rounded-2xl border border-border/50">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
            <span>Stream Health</span>
            <span className="text-green-500">EXCELLENT</span>
          </div>
          <Progress value={94} className="h-1.5" />
        </div>

        <div className="flex gap-2">
          <Button 
            className={cn(
              "flex-1 font-headline font-bold h-12 rounded-xl shadow-lg transition-all",
              isStreaming 
                ? "bg-background border-2 border-primary text-primary hover:bg-primary/5" 
                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
            )}
            onClick={onToggleStream}
          >
            {isStreaming ? (
              <><Square className="mr-2 w-4 h-4 fill-primary" /> STOP STREAM</>
            ) : (
              <><Play className="mr-2 w-4 h-4 fill-white" /> GO LIVE</>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-12 w-12 rounded-xl border-border/50"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-primary" /> : <Volume2 className="w-5 h-5 text-muted-foreground" />}
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-mono">
          <div className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            1080p60
          </div>
          <div className="flex items-center gap-1">
            <Plus className="w-3 h-3" />
            RTMP BRIDGE
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
