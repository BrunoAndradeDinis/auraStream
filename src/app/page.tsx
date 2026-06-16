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
    album_image?: string;
  };
}


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
          return {
            id: t.id,
            title: t.filename.replace('.mp3', ''),
            artist: t.metadata?.artist || 'Unknown',
            genre: t.metadata?.genre || 'Unknown',
            description: '',
            filename: t.filename,
            metadata: {
              source: t.metadata?.source || 'S3',
              song_name: t.metadata?.song_name,
              author: t.metadata?.artist,
              provider: t.metadata?.provider,
              download_stream_url: t.metadata?.download_stream_url,
              watch_url: t.metadata?.watch_url,
              album_image: t.metadata?.album_image
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
              album_image: currentTrack.metadata?.album_image,
            }
          }}
        />
      </div>
    </main>
  );
}
