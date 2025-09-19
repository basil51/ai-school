import { cacheManager as redisCache, CACHE_CONFIG } from './redis';
import { memoryCache } from './memory';

// Cache interface
export interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }>;
}

// Unified cache manager that falls back to memory cache if Redis is unavailable
export class UnifiedCacheManager implements CacheInterface {
  private useRedis: boolean = true;
  private redisHealthy: boolean = false;

  constructor() {
    this.initializeCache();
  }

  private async initializeCache(): Promise<void> {
    try {
      // Test Redis connection
      const health = await redisCache.healthCheck();
      this.redisHealthy = health.status === 'healthy';
      this.useRedis = this.redisHealthy;
      
      if (!this.redisHealthy && typeof window !== 'undefined') {
        console.warn('Redis not available, falling back to memory cache');
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        console.warn('Redis initialization failed, using memory cache:', error);
      }
      this.useRedis = false;
      this.redisHealthy = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.get<T>(key);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis get failed, falling back to memory cache:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    return memoryCache.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (this.useRedis && this.redisHealthy) {
      try {
        const result = await redisCache.set(key, value, ttl);
        if (result) return true;
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis set failed, falling back to memory cache:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    return memoryCache.set(key, value, ttl);
  }

  async del(key: string): Promise<boolean> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.del(key);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis delete failed, falling back to memory cache:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    return memoryCache.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.exists(key);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis exists failed, falling back to memory cache:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    return memoryCache.exists(key);
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    if (this.useRedis && this.redisHealthy) {
      try {
        const health = await redisCache.healthCheck();
        this.redisHealthy = health.status === 'healthy';
        return health;
      } catch (error) {
        console.error('Redis health check failed:', error);
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    // Memory cache is always "healthy" but has no latency concept
    return { status: 'healthy', latency: 0 };
  }

  // Advanced operations that work with both caches
  async cacheWithConfig<T>(
    config: typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG],
    identifier: string,
    data: T,
    customTtl?: number
  ): Promise<boolean> {
    const key = `${config.prefix}${identifier}`;
    return this.set(key, data, customTtl || config.ttl);
  }

  async getFromConfig<T>(
    config: typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG],
    identifier: string
  ): Promise<T | null> {
    const key = `${config.prefix}${identifier}`;
    return this.get<T>(key);
  }

  async warmCache<T>(
    config: typeof CACHE_CONFIG[keyof typeof CACHE_CONFIG],
    identifier: string,
    dataFetcher: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const cached = await this.getFromConfig<T>(config, identifier);
    if (cached) {
      return cached;
    }

    const fresh = await dataFetcher();
    await this.cacheWithConfig(config, identifier, fresh, customTtl);
    return fresh;
  }

  // Batch operations (only available with Redis)
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.mget<T>(keys);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis mget failed, falling back to individual gets:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    // Fallback to individual gets
    const results: (T | null)[] = [];
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    return results;
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.mset(keyValuePairs, ttl);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis mset failed, falling back to individual sets:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    // Fallback to individual sets
    for (const [key, value] of Object.entries(keyValuePairs)) {
      await this.set(key, value, ttl);
    }
    return true;
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<number> {
    if (this.useRedis && this.redisHealthy) {
      try {
        return await redisCache.invalidatePattern(pattern);
      } catch (error) {
        if (typeof window !== 'undefined') {
          console.warn('Redis pattern invalidation failed:', error);
        }
        this.redisHealthy = false;
        this.useRedis = false;
      }
    }
    
    // For memory cache, we need to check all keys
    const keys = memoryCache.keys();
    let deleted = 0;
    for (const key of keys) {
      if (key.includes(pattern.replace('*', ''))) {
        if (memoryCache.del(key)) {
          deleted++;
        }
      }
    }
    return deleted;
  }

  // Get cache statistics
  getStats(): {
    type: 'redis' | 'memory';
    healthy: boolean;
    size?: number;
    maxSize?: number;
  } {
    if (this.useRedis && this.redisHealthy) {
      return { type: 'redis', healthy: true };
    }
    
    const memStats = memoryCache.stats();
    return {
      type: 'memory',
      healthy: true,
      size: memStats.size,
      maxSize: memStats.maxSize
    };
  }

  // Force Redis reconnection
  async reconnectRedis(): Promise<boolean> {
    try {
      await redisCache.connect();
      const health = await redisCache.healthCheck();
      this.redisHealthy = health.status === 'healthy';
      this.useRedis = this.redisHealthy;
      return this.redisHealthy;
    } catch (error) {
      console.error('Redis reconnection failed:', error);
      this.redisHealthy = false;
      this.useRedis = false;
      return false;
    }
  }
}

// Singleton instance
export const cache = new UnifiedCacheManager();

// Export configuration and helper functions
export { CACHE_CONFIG } from './redis';
export { memoryCache } from './memory';

// Convenience functions
export const cacheLessonContent = async (lessonId: string, content: any) => {
  return cache.cacheWithConfig(CACHE_CONFIG.LESSON_CONTENT, lessonId, content);
};

export const getCachedLessonContent = async (lessonId: string) => {
  return cache.getFromConfig(CACHE_CONFIG.LESSON_CONTENT, lessonId);
};

export const cacheUserProgress = async (userId: string, progress: any) => {
  return cache.cacheWithConfig(CACHE_CONFIG.STUDENT_PROGRESS, userId, progress);
};

export const getCachedUserProgress = async (userId: string) => {
  return cache.getFromConfig(CACHE_CONFIG.STUDENT_PROGRESS, userId);
};

export const cacheAIContent = async (contentId: string, content: any) => {
  return cache.cacheWithConfig(CACHE_CONFIG.AI_GENERATED_CONTENT, contentId, content);
};

export const getCachedAIContent = async (contentId: string) => {
  return cache.getFromConfig(CACHE_CONFIG.AI_GENERATED_CONTENT, contentId);
};

export const cachePerformanceMetrics = async (metricId: string, metrics: any) => {
  return cache.cacheWithConfig(CACHE_CONFIG.PERFORMANCE_METRICS, metricId, metrics);
};

export const getCachedPerformanceMetrics = async (metricId: string) => {
  return cache.getFromConfig(CACHE_CONFIG.PERFORMANCE_METRICS, metricId);
};

export default cache;
