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

// Convert BigInt/Date in Prisma results into JSON-serializable primitives
export function toSerializable<T>(value: T): any {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === 'bigint') return (value as unknown as bigint).toString();
  if (t === 'object') {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => toSerializable(v));
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      out[k] = toSerializable(v);
    }
    return out;
  }
  return value;
}
