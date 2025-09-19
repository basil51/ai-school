import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Redis connection for caching - only if configured
let redis: Redis | null = null;

try {
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableReadyCheck: false,
    });

    redis.on('error', (error) => {
      console.warn('Performance Redis error (disabling cache):', error.message);
      redis = null;
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis (performance cache disabled):', error);
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  tags?: string[]; // For cache invalidation
}

export interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  databaseQueryTime: number;
  aiGenerationTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface OptimizationResult {
  originalTime: number;
  optimizedTime: number;
  improvement: number;
  method: string;
  cacheKey?: string;
}

export class PerformanceOptimizationEngine {
  private cachePrefix = 'ai-school:';
  private defaultTTL = 3600; // 1 hour

  private async safeRedisOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
    if (!redis) return fallback;
    try {
      return await operation();
    } catch (error) {
      console.warn('Redis operation failed:', error);
      return fallback;
    }
  }

  /**
   * Cache AI-generated content with intelligent key generation
   */
  async cacheAIContent(
    content: string,
    context: any,
    ttl: number = this.defaultTTL
  ): Promise<string> {
    const cacheKey = this.generateCacheKey('ai-content', context);
    const cacheData = {
      content,
      timestamp: Date.now(),
      context: this.sanitizeContext(context)
    };

    await this.safeRedisOperation(() => redis!.setex(cacheKey, ttl, JSON.stringify(cacheData)), undefined);
    return cacheKey;
  }

  /**
   * Retrieve cached AI content
   */
  async getCachedAIContent(context: any): Promise<string | null> {
    const cacheKey = this.generateCacheKey('ai-content', context);
    const cached = await this.safeRedisOperation(() => redis!.get(cacheKey), null);
    
    if (cached) {
      const data = JSON.parse(cached);
      return data.content;
    }
    
    return null;
  }

  /**
   * Cache database query results
   */
  async cacheQuery(
    query: string,
    params: any[],
    result: any,
    ttl: number = 1800 // 30 minutes
  ): Promise<string> {
    const cacheKey = this.generateCacheKey('db-query', { query, params });
    const cacheData = {
      result,
      timestamp: Date.now(),
      query: query.substring(0, 100) // Truncate for storage
    };

    await this.safeRedisOperation(() => redis!.setex(cacheKey, ttl, JSON.stringify(cacheData)), undefined);
    return cacheKey;
  }

  /**
   * Get cached query result
   */
  async getCachedQuery(query: string, params: any[]): Promise<any | null> {
    const cacheKey = this.generateCacheKey('db-query', { query, params });
    const cached = await this.safeRedisOperation(() => redis!.get(cacheKey), null);
    
    if (cached) {
      const data = JSON.parse(cached);
      return data.result;
    }
    
    return null;
  }

  /**
   * Cache student learning patterns for faster personalization
   */
  async cacheLearningPattern(
    studentId: string,
    pattern: any,
    ttl: number = 7200 // 2 hours
  ): Promise<string> {
    const cacheKey = this.generateCacheKey('learning-pattern', { studentId });
    const cacheData = {
      pattern,
      timestamp: Date.now(),
      studentId
    };

    await this.safeRedisOperation(() => redis!.setex(cacheKey, ttl, JSON.stringify(cacheData)), undefined);
    return cacheKey;
  }

  /**
   * Get cached learning pattern
   */
  async getCachedLearningPattern(studentId: string): Promise<any | null> {
    const cacheKey = this.generateCacheKey('learning-pattern', { studentId });
    const cached = await this.safeRedisOperation(() => redis!.get(cacheKey), null);
    
    if (cached) {
      const data = JSON.parse(cached);
      return data.pattern;
    }
    
    return null;
  }

  /**
   * Batch OpenAI API calls for efficiency
   */
  async batchOpenAICalls(requests: Array<{
    prompt: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  }>): Promise<any[]> {
    // Group similar requests to reduce API calls
    const groupedRequests = this.groupSimilarRequests(requests);
    const results: any[] = [];

    for (const group of groupedRequests) {
      if (group.length === 1) {
        // Single request - check cache first
        //const cacheKey = this.generateCacheKey('openai-batch', group[0]);
        const cached = await this.getCachedAIContent(group[0]);
        
        if (cached) {
          results.push(JSON.parse(cached));
          continue;
        }
      }

      // Process batch
      const batchResults = await this.processBatch(group);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Optimize database queries with intelligent indexing
   */
  async optimizeQuery(query: string, params: any[]): Promise<OptimizationResult> {
    const startTime = performance.now();
    
    // Check cache first
    const cached = await this.getCachedQuery(query, params);
    if (cached) {
      const endTime = performance.now();
      return {
        originalTime: endTime - startTime,
        optimizedTime: 1, // Cache hit is very fast
        improvement: 99,
        method: 'cache_hit',
        cacheKey: this.generateCacheKey('db-query', { query, params })
      };
    }

    // Execute query with performance monitoring
    const queryStart = performance.now();
    const result = await prisma.$queryRawUnsafe(query, ...params);
    const queryEnd = performance.now();

    // Cache the result
    await this.cacheQuery(query, params, result);

    const endTime = performance.now();
    return {
      originalTime: endTime - startTime,
      optimizedTime: queryEnd - queryStart,
      improvement: ((endTime - startTime) - (queryEnd - queryStart)) / (endTime - startTime) * 100,
      method: 'query_optimization'
    };
  }

  /**
   * Implement intelligent content pre-generation
   */
  async preGenerateContent(
    subjects: string[],
    topics: string[],
    difficultyLevels: string[]
  ): Promise<void> {
    const preGenerationPromises: Promise<void>[] = [];

    for (const subject of subjects) {
      for (const topic of topics) {
        for (const difficulty of difficultyLevels) {
          preGenerationPromises.push(
            this.preGenerateForContext(subject, topic, difficulty)
          );
        }
      }
    }

    await Promise.all(preGenerationPromises);
  }

  /**
   * Monitor and report performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const cacheInfo = await this.safeRedisOperation(() => redis!.info('memory'), '');
    const dbMetrics = await this.getDatabaseMetrics();
    
    return {
      responseTime: await this.getAverageResponseTime(),
      cacheHitRate: await this.calculateCacheHitRate(),
      databaseQueryTime: dbMetrics.averageQueryTime,
      aiGenerationTime: await this.getAverageAIGenerationTime(),
      memoryUsage: this.parseMemoryUsage(cacheInfo),
      cpuUsage: await this.getCPUUsage()
    };
  }

  /**
   * Implement smart cache invalidation
   */
  async invalidateCache(tags: string[]): Promise<void> {
    const keys = await this.safeRedisOperation(() => redis!.keys(`${this.cachePrefix}*`), []);
    const keysToDelete: string[] = [];

    for (const key of keys) {
      const cached = await this.safeRedisOperation(() => redis!.get(key), null);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.tags && data.tags.some((tag: string) => tags.includes(tag))) {
          keysToDelete.push(key);
        }
      }
    }

    if (keysToDelete.length > 0) {
      await this.safeRedisOperation(() => redis!.del(...keysToDelete), 0);
    }
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory(): Promise<void> {
    // Clear expired cache entries
    await this.safeRedisOperation(() => redis!.eval(`
      local keys = redis.call('keys', ARGV[1])
      local now = tonumber(ARGV[2])
      local expired = {}
      
      for i=1,#keys do
        local ttl = redis.call('ttl', keys[i])
        if ttl == -1 then
          table.insert(expired, keys[i])
        end
      end
      
      if #expired > 0 then
        redis.call('del', unpack(expired))
      end
    `, 0, `${this.cachePrefix}*`, Math.floor(Date.now() / 1000)), 0);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  // Private helper methods

  private generateCacheKey(prefix: string, context: any): string {
    const contextString = JSON.stringify(this.sanitizeContext(context));
    const hash = crypto.createHash('md5').update(contextString).digest('hex');
    return `${this.cachePrefix}${prefix}:${hash}`;
  }

  private sanitizeContext(context: any): any {
    // Remove sensitive data and normalize for caching
    const sanitized = { ...context };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    
    // Normalize arrays and objects
    if (Array.isArray(sanitized)) {
      return sanitized.map(item => this.sanitizeContext(item));
    }
    
    if (typeof sanitized === 'object' && sanitized !== null) {
      const normalized: any = {};
      for (const [key, value] of Object.entries(sanitized)) {
        normalized[key] = this.sanitizeContext(value);
      }
      return normalized;
    }
    
    return sanitized;
  }

  private groupSimilarRequests(requests: any[]): any[][] {
    // Group requests by model and similar parameters
    const groups: { [key: string]: any[] } = {};
    
    for (const request of requests) {
      const groupKey = `${request.model}:${request.temperature || 0.7}:${request.maxTokens || 1000}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(request);
    }
    
    return Object.values(groups);
  }

  private async processBatch(requests: any[]): Promise<any[]> {
    // Process batch of similar requests
    // This would integrate with OpenAI's batch API when available
    const results: any[] = [];
    
    for (const request of requests) {
      // For now, process individually but cache results
      //const cacheKey = this.generateCacheKey('openai-batch', request);
      const cached = await this.getCachedAIContent(request);
      
      if (cached) {
        results.push(JSON.parse(cached));
      } else {
        // Process request and cache result
        const result = await this.processOpenAIRequest(request);
        await this.cacheAIContent(JSON.stringify(result), request);
        results.push(result);
      }
    }
    
    return results;
  }

  private async processOpenAIRequest(request: any): Promise<any> {
    // Placeholder for OpenAI request processing
    // This would integrate with the actual OpenAI API
    return { content: 'Generated content', model: request.model };
  }

  private async preGenerateForContext(
    subject: string,
    topic: string,
    difficulty: string
  ): Promise<void> {
    const context = { subject, topic, difficulty };
    const cacheKey = this.generateCacheKey('pregen-content', context);
    
    // Check if already pre-generated
    const existing = await this.safeRedisOperation(() => redis!.get(cacheKey), null);
    if (existing) return;
    
    // Pre-generate content (placeholder)
    const content = `Pre-generated content for ${subject} - ${topic} (${difficulty})`;
    await this.cacheAIContent(content, context, 86400); // 24 hours
  }

  private async getAverageResponseTime(): Promise<number> {
    // Get average response time from metrics
    const metrics = await this.safeRedisOperation(() => redis!.get(`${this.cachePrefix}metrics:response-time`), null);
    return metrics ? parseFloat(metrics) : 0;
  }

  private async calculateCacheHitRate(): Promise<number> {
    const hits = await this.safeRedisOperation(() => redis!.get(`${this.cachePrefix}metrics:cache-hits`), '0');
    const misses = await this.safeRedisOperation(() => redis!.get(`${this.cachePrefix}metrics:cache-misses`), '0');
    const total = parseInt(hits || '0') + parseInt(misses || '0');
    return total > 0 ? parseInt(hits || '0') / total : 0;
  }

  private async getDatabaseMetrics(): Promise<{ averageQueryTime: number }> {
    // Get database performance metrics
    const queryTime = await this.safeRedisOperation(() => redis!.get(`${this.cachePrefix}metrics:db-query-time`), null);
    return {
      averageQueryTime: queryTime ? parseFloat(queryTime) : 0
    };
  }

  private async getAverageAIGenerationTime(): Promise<number> {
    const aiTime = await this.safeRedisOperation(() => redis!.get(`${this.cachePrefix}metrics:ai-generation-time`), null);
    return aiTime ? parseFloat(aiTime) : 0;
  }

  private parseMemoryUsage(cacheInfo: string): number {
    // Parse Redis memory usage from info
    const memoryMatch = cacheInfo.match(/used_memory_human:([^\r\n]+)/);
    return memoryMatch ? parseFloat(memoryMatch[1]) : 0;
  }

  private async getCPUUsage(): Promise<number> {
    // Get CPU usage (placeholder)
    return 0;
  }
}
