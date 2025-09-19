import { Redis } from 'ioredis';

// Redis client configuration with error handling
let redis: Redis | null = null;

// Only initialize Redis if we're not in build mode and Redis is configured
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';
if (!isBuildTime && (process.env.REDIS_URL || process.env.REDIS_HOST || process.env.NODE_ENV === 'development')) {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
    });

    // Handle Redis connection errors gracefully
    redis.on('error', (error) => {
      if (typeof window !== 'undefined') {
        console.warn('Redis connection error (cache will be disabled):', error.message);
      }
      redis = null;
    });

    redis.on('connect', () => {
      // Only log in browser environment, not during build
      if (typeof window !== 'undefined') {
        console.log('Redis connected successfully');
      }
    });
  } catch (error) {
    if (typeof window !== 'undefined') {
      console.warn('Failed to initialize Redis, caching will be disabled:', error);
    }
    redis = null;
  }
}

// Cache configuration
export const CACHE_CONFIG = {
  // Content caching
  LESSON_CONTENT: { ttl: 3600, prefix: 'lesson:' }, // 1 hour
  CURRICULUM_DATA: { ttl: 7200, prefix: 'curriculum:' }, // 2 hours
  AI_GENERATED_CONTENT: { ttl: 1800, prefix: 'ai_content:' }, // 30 minutes
  ASSESSMENT_DATA: { ttl: 1800, prefix: 'assessment:' }, // 30 minutes
  
  // User data caching
  USER_PROFILE: { ttl: 1800, prefix: 'user:' }, // 30 minutes
  STUDENT_PROGRESS: { ttl: 300, prefix: 'progress:' }, // 5 minutes
  LEARNING_ANALYTICS: { ttl: 600, prefix: 'analytics:' }, // 10 minutes
  
  // System data caching
  ORGANIZATION_DATA: { ttl: 3600, prefix: 'org:' }, // 1 hour
  SUBJECT_DATA: { ttl: 3600, prefix: 'subject:' }, // 1 hour
  TOPIC_DATA: { ttl: 3600, prefix: 'topic:' }, // 1 hour
  
  // Performance monitoring
  PERFORMANCE_METRICS: { ttl: 60, prefix: 'perf:' }, // 1 minute
  SYSTEM_HEALTH: { ttl: 30, prefix: 'health:' }, // 30 seconds
};

// Cache utility functions
export class CacheManager {
  private redis: Redis | null;

  constructor() {
    this.redis = redis;
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Pattern-based operations
  async getPattern(pattern: string): Promise<string[]> {
    if (!this.redis) return [];
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error('Cache pattern error:', error);
      return [];
    }
  }

  async delPattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  // Cache with automatic key generation
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

  // Batch operations for performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis) return keys.map(() => null);
    try {
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) : null);
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    if (!this.redis) return false;
    try {
      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }
      
      await this.redis.mset(...serializedPairs);
      
      if (ttl) {
        const pipeline = this.redis.pipeline();
        for (const key of Object.keys(keyValuePairs)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }
      
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Cache warming and invalidation
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

  async invalidatePattern(pattern: string): Promise<number> {
    return this.delPattern(pattern);
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const start = Date.now();
    if (!this.redis) {
      return { status: 'unhealthy', latency: 0 };
    }
    try {
      await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      console.error('Redis health check error:', error);
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  // Connection management
  async connect(): Promise<void> {
    if (!this.redis) {
      console.warn('Redis is not initialized, skipping connection');
      return;
    }
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Redis connection error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.disconnect();
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Helper functions for common cache operations
export const cacheLessonContent = async (lessonId: string, content: any) => {
  return cacheManager.cacheWithConfig(CACHE_CONFIG.LESSON_CONTENT, lessonId, content);
};

export const getCachedLessonContent = async (lessonId: string) => {
  return cacheManager.getFromConfig(CACHE_CONFIG.LESSON_CONTENT, lessonId);
};

export const cacheUserProgress = async (userId: string, progress: any) => {
  return cacheManager.cacheWithConfig(CACHE_CONFIG.STUDENT_PROGRESS, userId, progress);
};

export const getCachedUserProgress = async (userId: string) => {
  return cacheManager.getFromConfig(CACHE_CONFIG.STUDENT_PROGRESS, userId);
};

export const cacheAIContent = async (contentId: string, content: any) => {
  return cacheManager.cacheWithConfig(CACHE_CONFIG.AI_GENERATED_CONTENT, contentId, content);
};

export const getCachedAIContent = async (contentId: string) => {
  return cacheManager.getFromConfig(CACHE_CONFIG.AI_GENERATED_CONTENT, contentId);
};

export const cachePerformanceMetrics = async (metricId: string, metrics: any) => {
  return cacheManager.cacheWithConfig(CACHE_CONFIG.PERFORMANCE_METRICS, metricId, metrics);
};

export const getCachedPerformanceMetrics = async (metricId: string) => {
  return cacheManager.getFromConfig(CACHE_CONFIG.PERFORMANCE_METRICS, metricId);
};

export default cacheManager;
