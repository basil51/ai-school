"use client";
import React, { useMemo, useState } from 'react';

type ProjectileSimulatorProps = {
  g?: number; // gravity m/s^2
  initialSpeed?: number; // m/s
  angleDeg?: number; // degrees
};

function simulate(v0: number, angleDeg: number, g: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(rad);
  const vy = v0 * Math.sin(rad);
  const dt = 0.02;
  const points: { x: number; y: number }[] = [];
  let t = 0;
  while (true) {
    const x = vx * t;
    const y = vy * t - 0.5 * g * t * t;
    if (y < 0) break;
    points.push({ x, y });
    t += dt;
  }
  const range = (v0 * v0 * Math.sin(2 * rad)) / g;
  const height = (vy * vy) / (2 * g);
  const time = (2 * vy) / g;
  return { points, range, height, time };
}

export default function ProjectileSimulator({ g = 9.81, initialSpeed = 20, angleDeg = 45 }: ProjectileSimulatorProps) {
  const [speed, setSpeed] = useState(initialSpeed);
  const [angle, setAngle] = useState(angleDeg);
  const result = useMemo(() => simulate(speed, angle, g), [speed, angle, g]);

  const width = 640;
  const height = 360;
  const pad = 30;
  const maxX = Math.max(1, result.range * 1.1);
  const maxY = Math.max(1, result.height * 1.2);
  const scaleX = (x: number) => pad + (x / maxX) * (width - 2 * pad);
  const scaleY = (y: number) => height - pad - (y / maxY) * (height - 2 * pad);
  const path = result.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');

  return (
    <div className="grid gap-4">
      <div className="flex gap-4 items-center">
        <label className="text-sm">Speed: {speed.toFixed(1)} m/s</label>
        <input type="range" min={5} max={50} step={0.5} value={speed} onChange={e => setSpeed(Number(e.target.value))} />
        <label className="text-sm">Angle: {angle.toFixed(0)}°</label>
        <input type="range" min={10} max={80} step={1} value={angle} onChange={e => setAngle(Number(e.target.value))} />
      </div>
      <svg width={width} height={height} className="rounded-lg border border-gray-200 bg-white">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e5e7eb" />
        <path d={path} fill="none" stroke="#10b981" strokeWidth={2} />
      </svg>
      <div className="text-sm text-gray-700 grid grid-cols-3 gap-2">
        <div>Range: {result.range.toFixed(2)} m</div>
        <div>Max Height: {result.height.toFixed(2)} m</div>
        <div>Flight Time: {result.time.toFixed(2)} s</div>
      </div>
    </div>
  );
}


