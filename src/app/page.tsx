"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuroraBackground } from '@/components/streaming/AuroraBackground';
import { MiniPlayer } from '@/components/streaming/MiniPlayer';

import { useToast } from '@/hooks/use-toast';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { useWebSocket } from '@/hooks/use-websocket';

interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  description: string;
  filename?: string;
  metadata?: {
    song_name?: string;
    author?: string;
    provider?: string;
    download_stream_url?: string;
    watch_url?: string;
  };
}

import musicDetails from '@/assets/details/music-details.json';

export default function AuraStream() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  const [showOverlay, setShowOverlay] = useState(true);
  const { toast } = useToast();

  const [audioEnabled, setAudioEnabled] = useState(false);
  const { init, loadAndPlay, crossfadeTo, pause, resume, setVolume } = useAudioEngine();

  const currentTrack = tracks[currentTrackIndex] || {
    id: '0', title: 'Loading...', artist: '', genre: '', description: ''
  };

  const advanceTrack = useCallback(async (isSkip = false) => {
    if (tracks.length === 0) return;
    
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIdx];
    const isLooped = nextIdx === 0 && tracks.length > 1;
    
    setCurrentTrackIndex(nextIdx);
    
    const onEnd = () => advanceTrack(false);
    
    if (isSkip || isStreaming) {
      crossfadeTo(`/api/audio/${encodeURIComponent(nextTrack.filename!)}`, onEnd).catch(() => {
        // Ignorar se falhar ou enviar erro
      });
    }

    // Usaremos ref para emitir quando a conexão WS estiver disponível
    return { nextTrack, isLooped };
  }, [tracks, currentTrackIndex, isStreaming, crossfadeTo]);

  const sendRef = useRef<((event: string, payload?: any) => void) | null>(null);

  const handleWebSocketMessage = useCallback(async (event: string, payload: any) => {
    if (event === 'server:state_sync') {
      const state = payload;
      if (state.queue && state.queue.length > 0) {
        const mappedTracks = state.queue.map((t: any) => {
          const matchedDetail = musicDetails.find((d: any) => {
            const nameToMatch = d.song.song_name.split(' (')[0].split(' [')[0].toLowerCase();
            return t.filename.toLowerCase().includes(nameToMatch);
          });

          return {
            id: t.id,
            title: t.filename.replace('.mp3', ''),
            artist: matchedDetail ? matchedDetail.song.author : 'Unknown',
            genre: matchedDetail ? matchedDetail.provider : 'Unknown',
            description: '',
            filename: t.filename,
            metadata: {
              song_name: matchedDetail ? matchedDetail.song.song_name : undefined,
              author: matchedDetail ? matchedDetail.song.author : undefined,
              provider: matchedDetail ? matchedDetail.provider : undefined,
              download_stream_url: matchedDetail ? matchedDetail.download_stream_url : undefined,
              watch_url: matchedDetail ? matchedDetail.watch_url : undefined
            }
          };
        });
        
        setTracks((prev) => {
          if (prev.length === 0) return mappedTracks;
          return mappedTracks.map((mt: Track) => {
            const existing = prev.find((p: Track) => p.id === mt.id);
            return existing ? { ...mt, description: existing.description } : mt;
          });
        });

        if (state.currentTrack) {
          const idx = mappedTracks.findIndex((t: Track) => t.id === state.currentTrack.id);
          if (idx !== -1 && idx !== currentTrackIndex) setCurrentTrackIndex(idx);
        }
      }

      const newIsStreaming = state.status === 'streaming';
      setIsStreaming(newIsStreaming);

      if (audioEnabled) {
        if (newIsStreaming) {
          resume();
        } else if (state.status === 'paused') {
          pause();
        }
      }
    } else if (event === 'media:play' && audioEnabled) {
      resume();
    } else if (event === 'media:pause' && audioEnabled) {
      pause();
    } else if (event === 'media:skip' && audioEnabled) {
      const res = await advanceTrack(true);
      if (res && sendRef.current) {
        sendRef.current('player:track_changed', { trackId: res.nextTrack.id });
        if (res.isLooped) sendRef.current('player:queue_looped', {});
      }
    } else if (event === 'media:volume' && audioEnabled) {
      const vol = Math.max(0, Math.min(1, Number(payload)));
      setVolume(vol);
    }
  }, [audioEnabled, pause, resume, advanceTrack, currentTrackIndex, setVolume]);

  const { send } = useWebSocket(handleWebSocketMessage);
  useEffect(() => { sendRef.current = send; }, [send]);

  const currentlyPlayingRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (audioEnabled && tracks.length > 0) {
      const track = tracks[currentTrackIndex];
      if (track && track.filename && currentlyPlayingRef.current !== track.id) {
        currentlyPlayingRef.current = track.id;
        const onEnd = async () => {
          const res = await advanceTrack(false);
          if (res) {
             send('player:track_changed', { trackId: res.nextTrack.id });
             if (res.isLooped) send('player:queue_looped', {});
          }
        };
        
        // Initial load
        loadAndPlay(`/api/audio/${encodeURIComponent(track.filename)}`, onEnd).catch(() => {
          send('player:error', 'decode_failed');
        });
      }
    }
  }, [audioEnabled, tracks, currentTrackIndex, loadAndPlay, advanceTrack, send]);



  const toggleStream = () => {
    if (!isStreaming) {
      send('media:start_stream');
    } else {
      send('media:stop_stream');
    }
  };

  useEffect(() => {
    // Prevent the Puppeteer streaming client from playing audio,
    // as it consumes massive memory for decoding MP3s and the server already streams the audio directly.
    const isStreamClient = typeof window !== 'undefined' && 
      new URLSearchParams(window.location.search).get('stream_client') === 'true';

    if (!audioEnabled && !isStreamClient) {
      init();
      setAudioEnabled(true);
    }
  }, [audioEnabled, init]);

  return (
    <main className="relative min-h-screen w-full flex overflow-hidden font-body">
      {/* Background Engine */}
      <AuroraBackground />

      {/* Live Feed View (The part that actually gets captured) */}
      <div className="flex-1 relative pointer-events-none">
        {/* Stream Info Indicator (Top Left) */}
        <div className="absolute top-8 left-8 flex items-center gap-4 animate-fade-in-up">
           <div className="flex flex-col">
              <span className="text-white font-headline font-bold text-lg tracking-tighter">AuraStream HD</span>
              <div className="flex items-center gap-2">
                <span className={`flex h-1.5 w-1.5 rounded-full ${isStreaming ? 'bg-primary' : 'bg-gray-500'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isStreaming ? 'text-primary' : 'text-gray-500'}`}>
                  {isStreaming ? 'Live Pipeline Active' : 'Pipeline Idle'}
                </span>
              </div>
           </div>
        </div>

        {/* The Visual Miniplayer Overlay */}
        <MiniPlayer 
          currentTrack={{
            id: 'mock-1',
            filename: currentTrack.title + '.mp3',
            path: '',
            metadata: {
              artist: currentTrack.artist,
              genre: currentTrack.genre,
              source: 'NCS',
              song_name: currentTrack.metadata?.song_name,
              author: currentTrack.metadata?.author,
              provider: currentTrack.metadata?.provider,
              download_stream_url: currentTrack.metadata?.download_stream_url,
              watch_url: currentTrack.metadata?.watch_url,
            }
          }}
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
