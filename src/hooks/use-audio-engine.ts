'use client';
import { useRef, useCallback } from 'react';

/**
 * useAudioEngine — versão sem vazamento de memória.
 *
 * MUDANÇA CRÍTICA: substituímos `fetch + arrayBuffer + decodeAudioData` por
 * `MediaElementAudioSourceNode` com um elemento <audio> nativo.
 *
 * Por quê isso importa:
 *  - A abordagem anterior baixava cada música INTEIRA (~5-15 MB de MP3) e a
 *    decodificava em PCM bruto (~50-60 MB). Em 8h de live com ~120 músicas,
 *    isso acumulava >500 MB de AudioBuffers que o GC do Chrome não liberava
 *    rápido o suficiente, causando o "Aw, Snap! Error code: 3" (OOM).
 *  - Com MediaElementAudioSourceNode, o browser faz streaming incremental
 *    do áudio sem manter todo o PCM decodificado em memória.
 */
export function useAudioEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Referências para o elemento de áudio atual e seu nó no grafo
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceGainRef = useRef<GainNode | null>(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;
    ctxRef.current = new AudioContext();
    masterGainRef.current = ctxRef.current.createGain();
    masterGainRef.current.connect(ctxRef.current.destination);
  }, []);

  /** Libera completamente o elemento <audio> anterior para permitir GC */
  const _destroyCurrentAudio = useCallback(() => {
    const oldEl = audioElRef.current;
    const oldSrc = sourceNodeRef.current;
    const oldGain = sourceGainRef.current;

    if (oldEl) {
      oldEl.onended = null;
      oldEl.onerror = null;
      oldEl.pause();
      oldEl.removeAttribute('src');
      oldEl.load(); // força o browser a liberar os buffers de decodificação
    }
    if (oldSrc) {
      oldSrc.disconnect();
    }
    if (oldGain) {
      oldGain.disconnect();
    }

    audioElRef.current = null;
    sourceNodeRef.current = null;
    sourceGainRef.current = null;
  }, []);

  const loadAndPlay = useCallback(async (trackPath: string, onEnd: () => void) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterGainRef.current) return;

    _destroyCurrentAudio();

    const audio = new Audio(trackPath);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const source = ctx.createMediaElementSource(audio);
    const gain = ctx.createGain();
    gain.gain.value = 1.0;

    source.connect(gain);
    gain.connect(masterGainRef.current);

    audio.onended = onEnd;
    audio.onerror = () => {
      _destroyCurrentAudio();
      throw new Error('decode_failed');
    };

    audioElRef.current = audio;
    sourceNodeRef.current = source;
    sourceGainRef.current = gain;

    try {
      await audio.play();
    } catch {
      throw new Error('decode_failed');
    }
  }, [_destroyCurrentAudio]);

  const crossfadeTo = useCallback(async (trackPath: string, onEnd: () => void) => {
    const ctx = ctxRef.current;
    if (!ctx || !masterGainRef.current) return;

    const FADE_S = 0.5;
    const now = ctx.currentTime;

    // Fade out do track atual
    const oldGain = sourceGainRef.current;
    const oldEl = audioElRef.current;
    const oldSrc = sourceNodeRef.current;

    if (oldGain) {
      oldGain.gain.setValueAtTime(1.0, now);
      oldGain.gain.linearRampToValueAtTime(0.0, now + FADE_S);
    }

    // Prepara novo elemento de áudio
    const audio = new Audio(trackPath);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';

    const inSource = ctx.createMediaElementSource(audio);
    const inGain = ctx.createGain();
    inGain.gain.setValueAtTime(0.0, now);
    inGain.gain.linearRampToValueAtTime(1.0, now + FADE_S);

    inSource.connect(inGain);
    inGain.connect(masterGainRef.current);

    audio.onended = onEnd;
    audio.onerror = () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      inSource.disconnect();
      inGain.disconnect();
      throw new Error('decode_failed');
    };

    try {
      await audio.play();
    } catch {
      throw new Error('decode_failed');
    }

    // Atualiza refs para o novo track
    audioElRef.current = audio;
    sourceNodeRef.current = inSource;
    sourceGainRef.current = inGain;

    // Libera o track anterior após o fade
    setTimeout(() => {
      if (oldEl) {
        oldEl.onended = null;
        oldEl.onerror = null;
        oldEl.pause();
        oldEl.removeAttribute('src');
        oldEl.load(); // libera buffers de decodificação
      }
      if (oldSrc) oldSrc.disconnect();
      if (oldGain) oldGain.disconnect();
    }, FADE_S * 1000 + 150);
  }, []);

  const pause = useCallback(() => {
    ctxRef.current?.suspend();
    audioElRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    ctxRef.current?.resume();
    if (audioElRef.current?.paused) {
      audioElRef.current.play().catch(() => {});
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    if (!masterGainRef.current || !ctxRef.current) return;
    masterGainRef.current.gain.linearRampToValueAtTime(v, ctxRef.current.currentTime + 0.1);
  }, []);

  return { init, loadAndPlay, crossfadeTo, pause, resume, setVolume };
}
