"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

type AudioNarratorProps = {
  text: string;
  lang?: string;
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
};

export default function AudioNarrator({ text, lang = 'en-US', rate = 1, pitch = 1 }: AudioNarratorProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supportsTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = () => {
    if (!supportsTTS) return;
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.pitch = pitch;
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
    setIsSpeaking(true);
  };

  const pause = () => {
    if (!supportsTTS) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const stop = () => {
    if (!supportsTTS) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  useEffect(() => {
    return () => stop();
  }, []);

  if (!supportsTTS) {
    return <div className="text-sm text-gray-500">Text-to-speech is not supported in this browser.</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={speak} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">{isSpeaking && !isPaused ? 'Restart' : 'Play'}</button>
      <button onClick={pause} className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600" disabled={!isSpeaking || isPaused}>Pause</button>
      <button onClick={stop} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" disabled={!isSpeaking}>Stop</button>
    </div>
  );
}


