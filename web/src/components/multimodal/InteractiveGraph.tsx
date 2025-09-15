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
  
  // Track if we've already logged an error for this expression
  let errorLogged = false;
  
  // Create a safer function evaluator
  const evaluateExpression = (x: number): number => {
    try {
      // Clean and validate the expression
      let cleanExpression = expression
        .replace(/[^x0-9+\-*/().\s]/g, '') // Remove potentially dangerous characters
        .replace(/\s+/g, '') // Remove all whitespace
        .trim();
      
      // Handle implicit multiplication (e.g., 2x -> 2*x, (x+1)(x-1) -> (x+1)*(x-1))
      cleanExpression = cleanExpression
        // Add multiplication between decimal/number and x: 2x -> 2*x, 3.14x -> 3.14*x
        .replace(/(\d(?:\.\d+)?)([x])/g, '$1*$2')
        // Add multiplication between x and decimal/number: x2 -> x*2, x3.14 -> x*3.14
        .replace(/([x])(\d(?:\.\d+)?)/g, '$1*$2')
        // Add multiplication between ) and (: )(  -> )*(
        .replace(/\)\(/g, ')*(')
        // Add multiplication between ) and x: )x -> )*x
        .replace(/\)([x])/g, ')*$1')
        // Add multiplication between x and (: x( -> x*(
        .replace(/([x])\(/g, '$1*(')
        // Add multiplication between decimal/number and (: 2( -> 2*(, 3.14( -> 3.14*(
        .replace(/(\d(?:\.\d+)?)\(/g, '$1*(')
        // Add multiplication between ) and decimal/number: )2 -> )*2, )3.14 -> )*3.14
        .replace(/\)(\d(?:\.\d+)?)/g, ')*$1');

      // Handle common mathematical functions and constants
      const safeExpression = cleanExpression
        .replace(/\bMath\.sin\b/g, 'Math.sin')
        .replace(/\bMath\.cos\b/g, 'Math.cos')
        .replace(/\bMath\.tan\b/g, 'Math.tan')
        .replace(/\bMath\.sqrt\b/g, 'Math.sqrt')
        .replace(/\bMath\.abs\b/g, 'Math.abs')
        .replace(/\bMath\.pow\b/g, 'Math.pow')
        .replace(/\bMath\.exp\b/g, 'Math.exp')
        .replace(/\bMath\.log\b/g, 'Math.log')
        .replace(/\bMath\.PI\b/g, 'Math.PI')
        .replace(/\bMath\.E\b/g, 'Math.E')
        .replace(/\^/g, '**') // Convert ^ to ** for exponentiation
        .replace(/\bx\b/g, `(${x})`); // Replace x with the actual value
      
      // Validate that the expression doesn't contain assignment operators
      if (safeExpression.includes('=') || safeExpression.includes('let') || safeExpression.includes('var') || safeExpression.includes('const')) {
        throw new Error('Invalid expression: contains assignment operators');
      }
      
      // Use Function constructor with safer approach
      const func = new Function('Math', 'x', `return ${safeExpression}`);
      return func(Math, x);
    } catch (error) {
      // Only log the error once per expression, not for every point
      if (!errorLogged) {
        console.warn('Expression evaluation error:', error);
        errorLogged = true;
      }
      return NaN;
    }
  };
  
  const pts: Point[] = [];
  for (let i = 0; i < samples; i++) {
    const x = minX + i * step;
    const y = evaluateExpression(x);
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
    if (expression && expression.trim()) {
      try {
        return generatePoints(expression, xRange, samples);
      } catch (error) {
        console.warn('Failed to generate points from expression:', error);
        return [];
      }
    }
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

  // Show error message if no valid points
  if (computed.length === 0) {
    return (
      <div className="w-full">
        {title && <div className="mb-2 text-sm text-gray-700">{title}</div>}
        <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center text-gray-500">
            <div className="text-sm mb-1">Unable to generate graph</div>
            <div className="text-xs">
              {expression ? 'Invalid mathematical expression' : 'No data points provided'}
            </div>
          </div>
        </div>
      </div>
    );
  }

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