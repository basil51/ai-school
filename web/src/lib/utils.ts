import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - start);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[timing] ${label}: ${ms}ms`);
  }
  return { result, ms };
}
