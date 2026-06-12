'use client';
import { useRef, useCallback } from 'react';

export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sourceGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    ctxRef.current = new AudioContext();
    masterGainRef.current = ctxRef.current.createGain();
    masterGainRef.current.connect(ctxRef.current.destination);
  }, []);

  const loadAndPlay = useCallback(async (trackPath: string, onEnd: () => void) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterGainRef.current) return;

    try {
      const response = await fetch(trackPath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      if (sourceRef.current) {
        sourceRef.current.onended = null;
        try { sourceRef.current.stop(); } catch (e) {}
        sourceRef.current.disconnect();
      }
      if (sourceGainRef.current) {
        sourceGainRef.current.disconnect();
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const gain = ctx.createGain();
      gain.gain.value = 1.0;
      
      source.connect(gain);
      gain.connect(masterGainRef.current);
      source.loop = false;
      source.onended = onEnd;
      source.start(0);
      
      sourceRef.current = source;
      sourceGainRef.current = gain;
    } catch {
      throw new Error('decode_failed');
    }
  }, []);

  const crossfadeTo = useCallback(async (trackPath: string, onEnd: () => void) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterGainRef.current) return;

    const FADE_MS = 0.5;
    const now = ctx.currentTime;

    const oldSource = sourceRef.current;
    const oldGain = sourceGainRef.current;

    if (oldGain) {
      oldGain.gain.setValueAtTime(1.0, now);
      oldGain.gain.linearRampToValueAtTime(0.0, now + FADE_MS);
    }

    try {
      const response = await fetch(trackPath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const inSource = ctx.createBufferSource();
      inSource.buffer = audioBuffer;
      const inGain = ctx.createGain();
      inGain.gain.setValueAtTime(0.0, now);
      inGain.gain.linearRampToValueAtTime(1.0, now + FADE_MS);
      
      inSource.connect(inGain);
      inGain.connect(masterGainRef.current);
      inSource.loop = false;
      inSource.onended = onEnd;
      inSource.start(now);

      sourceRef.current = inSource;
      sourceGainRef.current = inGain;

      setTimeout(() => {
        if (oldSource) {
          oldSource.onended = null;
          oldSource.stop();
          oldSource.disconnect();
        }
        if (oldGain) {
          oldGain.disconnect();
        }
      }, FADE_MS * 1000 + 100);
    } catch {
      throw new Error('decode_failed');
    }
  }, []);

  const pause = useCallback(() => ctxRef.current?.suspend(), []);
  const resume = useCallback(() => ctxRef.current?.resume(), []);
  const setVolume = useCallback((v: number) => {
    if (!masterGainRef.current || !ctxRef.current) return;
    masterGainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.1);
  }, []);

  return { init, loadAndPlay, crossfadeTo, pause, resume, setVolume };
}
