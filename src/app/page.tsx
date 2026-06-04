"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { AuroraBackground } from '@/components/streaming/AuroraBackground';
import { MiniPlayer } from '@/components/streaming/MiniPlayer';
import { Dashboard } from '@/components/streaming/Dashboard';
import { generateCreativeTrackDescription } from '@/ai/flows/generate-creative-track-description';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
}

const INITIAL_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'Synthetix',
    genre: 'Synthwave',
    description: 'A pulsing journey through a futuristic cityscape, wrapped in neon lights.'
  },
  {
    id: '2',
    title: 'Midnight Echo',
    artist: 'Luna Vibe',
    genre: 'Lo-fi',
    description: 'Chill rhythms that drift like smoke through a midnight sky.'
  },
  {
    id: '3',
    title: 'Cyber Pulse',
    artist: 'Glitch Mode',
    genre: 'Techno',
    description: 'Intense rhythmic exploration of binary worlds and digital heartbeats.'
  },
  {
    id: '4',
    title: 'Solar Winds',
    artist: 'Cosmo Kid',
    genre: 'Ambient',
    description: 'Ethereal soundscapes that echo the vastness of the outer reaches.'
  }
];

export default function AuraStream() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const { toast } = useToast();

  const currentTrack = tracks[currentTrackIndex];

  const handleNextTrack = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  }, [tracks.length]);

  useEffect(() => {
    if (!isStreaming) return;

    // Simulate track rotation every 30 seconds
    const interval = setInterval(() => {
      setShowOverlay(false);
      setTimeout(() => {
        handleNextTrack();
        setShowOverlay(true);
      }, 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, [isStreaming, handleNextTrack]);

  const handleGenerateDescription = async (track: Track) => {
    setIsGenerating(true);
    try {
      const result = await generateCreativeTrackDescription({
        title: track.title,
        artist: track.artist,
        genre: track.genre
      });
      
      setTracks(prev => prev.map(t => 
        t.id === track.id 
          ? { ...t, description: result.description } 
          : t
      ));
      
      toast({
        title: "Metadata Enhanced",
        description: "AI description generated successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not reach AI description service."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleStream = () => {
    setIsStreaming(!isStreaming);
    if (!isStreaming) {
      toast({
        title: "Stream Started",
        description: "AuraStream is now pushing to the RTMP bridge."
      });
    } else {
      toast({
        title: "Stream Stopped",
        description: "Feed has been disconnected."
      });
    }
  };

  return (
    <main className="relative min-h-screen w-full flex overflow-hidden font-body">
      {/* Background Engine */}
      <AuroraBackground />
      
      {/* Management Layer (Admin Panel) */}
      <Dashboard 
        tracks={tracks}
        currentTrackId={currentTrack.id}
        isStreaming={isStreaming}
        onToggleStream={toggleStream}
        onSelectTrack={(id) => {
          const idx = tracks.findIndex(t => t.id === id);
          if (idx !== -1) {
            setShowOverlay(false);
            setTimeout(() => {
              setCurrentTrackIndex(idx);
              setShowOverlay(true);
            }, 500);
          }
        }}
        onGenerateDescription={handleGenerateDescription}
        isGenerating={isGenerating}
      />

      {/* Live Feed View (The part that actually gets captured) */}
      <div className="flex-1 relative">
        {/* Stream Info Indicator (Top Left) */}
        <div className="absolute top-8 left-8 flex items-center gap-4 animate-fade-in-up">
           <div className="flex flex-col">
              <span className="text-white font-headline font-bold text-lg tracking-tighter">AuraStream HD</span>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Live Pipeline Active</span>
              </div>
           </div>
        </div>

        {/* The Visual Miniplayer Overlay */}
        <MiniPlayer 
          trackTitle={currentTrack.title}
          artist={currentTrack.artist}
          description={currentTrack.description}
          isVisible={showOverlay}
        />

        {/* Subtle Watermark */}
        <div className="absolute top-8 right-8 opacity-20 hover:opacity-100 transition-opacity cursor-default select-none">
          <p className="text-[10px] font-mono text-white text-right">
            BROADCAST NODE: VM-E82-LATAM<br/>
            BITRATE: 6500 KBPS / H.264
          </p>
        </div>
      </div>
    </main>
  );
}
