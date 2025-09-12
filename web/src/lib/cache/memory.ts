// Memory-based cache fallback for when Redis is not available
interface CacheItem<T> {
  value: T;
  expires: number;
  createdAt: number;
}

export class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (item.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, item] of this.cache.entries()) {
        if (item.createdAt < oldestTime) {
          oldestTime = item.createdAt;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (item.expires <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  set<T>(key: string, value: T, ttl: number = 3600): boolean {
    try {
      this.evictOldest();
      
      const now = Date.now();
      this.cache.set(key, {
        value,
        expires: now + (ttl * 1000),
        createdAt: now
      });
      
      return true;
    } catch (error) {
      console.error('Memory cache set error:', error);
      return false;
    }
  }

  del(key: string): boolean {
    return this.cache.delete(key);
  }

  exists(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (item.expires <= Date.now()) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  stats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();
