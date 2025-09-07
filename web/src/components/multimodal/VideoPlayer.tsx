"use client";
import React, { useRef, useState } from 'react';

type VideoPlayerProps = {
  src: string;
  captions?: string;
  poster?: string;
};

export default function VideoPlayer({ src, captions, poster }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); } else { v.pause(); setIsPlaying(false); }
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = ref.current; if (!v) return;
    const value = Number(e.target.value);
    v.volume = value; setVolume(value);
  };

  return (
    <div className="w-full">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video ref={ref} className="w-full h-full" poster={poster} controls={false}>
          <source src={src} />
          {captions && <track kind="captions" srcLang="en" src={captions} default />}
        </video>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex items-center gap-3">
          <button onClick={toggle} className="px-3 py-1 rounded bg-white/90 text-gray-900 hover:bg-white">{isPlaying ? 'Pause' : 'Play'}</button>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={onVolume} className="w-40" />
        </div>
      </div>
    </div>
  );
}


