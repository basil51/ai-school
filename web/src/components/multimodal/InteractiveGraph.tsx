"use client";
import React, { useMemo, useState } from 'react';

type Point = { x: number; y: number };

type InteractiveGraphProps = {
  width?: number;
  height?: number;
  points?: Point[];
  expression?: string; // e.g., "Math.sin(x)" or "x*x - 4*x + 3"
  xRange?: [number, number];
  samples?: number;
  title?: string;
};

function generatePoints(expression: string, xRange: [number, number], samples: number): Point[] {
  const [minX, maxX] = xRange;
  const step = (maxX - minX) / (samples - 1);
  const f = new Function('x', `return (${expression});`) as (x: number) => number;
  const pts: Point[] = [];
  for (let i = 0; i < samples; i++) {
    const x = minX + i * step;
    let y = NaN;
    try { y = f(x); } catch { y = NaN; }
    if (!Number.isFinite(y)) continue;
    pts.push({ x, y });
  }
  return pts;
}

export default function InteractiveGraph({
  width = 600,
  height = 320,
  points,
  expression,
  xRange = [-10, 10],
  samples = 200,
  title
}: InteractiveGraphProps) {
  const computed = useMemo(() => {
    if (points && points.length > 0) return points;
    if (expression) return generatePoints(expression, xRange, samples);
    return [];
  }, [points, expression, xRange, samples]);

  const minX = xRange[0];
  const maxX = xRange[1];
  const ys = computed.map(p => p.y);
  const minY = ys.length ? Math.min(...ys) : -1;
  const maxY = ys.length ? Math.max(...ys) : 1;
  const pad = 20;

  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (width - 2 * pad);
  const scaleY = (y: number) => pad + (1 - (y - minY) / (maxY - minY || 1)) * (height - 2 * pad);

  const path = computed
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
    .join(' ');

  return (
    <div className="w-full">
      {title && <div className="mb-2 text-sm text-gray-700">{title}</div>}
      <svg width={width} height={height} className="rounded-lg border border-gray-200 bg-white">
        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#e5e7eb" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#e5e7eb" />
        {/* Path */}
        <path d={path} fill="none" stroke="url(#g)" strokeWidth={2} />
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}


