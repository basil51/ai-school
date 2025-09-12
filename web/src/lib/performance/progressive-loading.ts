import { cache } from '../cache';

// Progressive loading configuration
export interface ProgressiveLoadingConfig {
  priority: 'high' | 'medium' | 'low';
  preload: boolean;
  lazy: boolean;
  chunkSize: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface LoadingChunk {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | '3d-model' | 'interactive';
  url: string;
  size: number;
  priority: number;
  loaded: boolean;
  error?: string;
  progress: number;
  startTime?: number;
  endTime?: number;
}

export interface LoadingSession {
  id: string;
  lessonId: string;
  chunks: LoadingChunk[];
  totalSize: number;
  loadedSize: number;
  progress: number;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'loading' | 'completed' | 'failed' | 'paused';
}

// Progressive loading manager
export class ProgressiveLoadingManager {
  private sessions = new Map<string, LoadingSession>();
  private activeLoads = new Set<string>();
  private maxConcurrentLoads = 5;
  private loadingQueue: LoadingChunk[] = [];
  private preloadCache = new Map<string, any>();

  // Initialize loading session
  async initializeSession(
    lessonId: string,
    content: any,
    config: Partial<ProgressiveLoadingConfig> = {}
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultConfig: ProgressiveLoadingConfig = {
      priority: 'medium',
      preload: true,
      lazy: true,
      chunkSize: 1024 * 1024, // 1MB
      maxConcurrent: 3,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    // Parse content and create chunks
    const chunks = await this.parseContentToChunks(content, defaultConfig);
    
    const session: LoadingSession = {
      id: sessionId,
      lessonId,
      chunks,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      loadedSize: 0,
      progress: 0,
      startTime: Date.now(),
      status: 'pending',
    };

    this.sessions.set(sessionId, session);

    // Start loading if not lazy
    if (!defaultConfig.lazy) {
      await this.startLoading(sessionId);
    }

    return sessionId;
  }

  // Parse content into loadable chunks
  private async parseContentToChunks(
    content: any,
    config: ProgressiveLoadingConfig
  ): Promise<LoadingChunk[]> {
    const chunks: LoadingChunk[] = [];

    // Text content
    if (content.text) {
      const textChunks = this.chunkText(content.text, config.chunkSize);
      textChunks.forEach((chunk, index) => {
        chunks.push({
          id: `text_${index}`,
          type: 'text',
          url: `data:text/plain;base64,${btoa(chunk)}`,
          size: chunk.length,
          priority: config.priority === 'high' ? 10 : config.priority === 'medium' ? 5 : 1,
          loaded: false,
          progress: 0,
        });
      });
    }

    // Images
    if (content.images) {
      content.images.forEach((image: any, index: number) => {
        chunks.push({
          id: `image_${index}`,
          type: 'image',
          url: image.url,
          size: image.size || 0,
          priority: image.priority || (config.priority === 'high' ? 8 : 4),
          loaded: false,
          progress: 0,
        });
      });
    }

    // Videos
    if (content.videos) {
      content.videos.forEach((video: any, index: number) => {
        chunks.push({
          id: `video_${index}`,
          type: 'video',
          url: video.url,
          size: video.size || 0,
          priority: video.priority || (config.priority === 'high' ? 9 : 3),
          loaded: false,
          progress: 0,
        });
      });
    }

    // 3D Models
    if (content.models3d) {
      content.models3d.forEach((model: any, index: number) => {
        chunks.push({
          id: `model3d_${index}`,
          type: '3d-model',
          url: model.url,
          size: model.size || 0,
          priority: model.priority || (config.priority === 'high' ? 7 : 2),
          loaded: false,
          progress: 0,
        });
      });
    }

    // Interactive content
    if (content.interactive) {
      content.interactive.forEach((item: any, index: number) => {
        chunks.push({
          id: `interactive_${index}`,
          type: 'interactive',
          url: item.url,
          size: item.size || 0,
          priority: item.priority || (config.priority === 'high' ? 6 : 3),
          loaded: false,
          progress: 0,
        });
      });
    }

    // Sort by priority (higher priority first)
    return chunks.sort((a, b) => b.priority - a.priority);
  }

  // Chunk text content
  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const words = text.split(' ');
    
    for (const word of words) {
      if (currentChunk.length + word.length + 1 > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk += (currentChunk.length > 0 ? ' ' : '') + word;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  // Start loading session
  async startLoading(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'loading') return;

    session.status = 'loading';
    
    // Add chunks to loading queue
    session.chunks.forEach(chunk => {
      if (!chunk.loaded && !this.loadingQueue.includes(chunk)) {
        this.loadingQueue.push(chunk);
      }
    });

    // Start loading process
    this.processLoadingQueue();
  }

  // Process loading queue
  private async processLoadingQueue(): Promise<void> {
    while (this.loadingQueue.length > 0 && this.activeLoads.size < this.maxConcurrentLoads) {
      const chunk = this.loadingQueue.shift();
      if (chunk && !chunk.loaded) {
        this.loadChunk(chunk);
      }
    }
  }

  // Load individual chunk
  private async loadChunk(chunk: LoadingChunk): Promise<void> {
    if (this.activeLoads.has(chunk.id)) return;
    
    this.activeLoads.add(chunk.id);
    chunk.startTime = Date.now();

    try {
      // Check cache first
      const cached = await cache.get(`chunk:${chunk.id}`);
      if (cached) {
        chunk.loaded = true;
        chunk.progress = 100;
        chunk.endTime = Date.now();
        this.updateSessionProgress(chunk);
        this.activeLoads.delete(chunk.id);
        this.processLoadingQueue();
        return;
      }

      // Load chunk based on type
      let data: any;
      switch (chunk.type) {
        case 'text':
          data = await this.loadTextChunk(chunk);
          break;
        case 'image':
          data = await this.loadImageChunk(chunk);
          break;
        case 'video':
          data = await this.loadVideoChunk(chunk);
          break;
        case '3d-model':
          data = await this.load3DModelChunk(chunk);
          break;
        case 'interactive':
          data = await this.loadInteractiveChunk(chunk);
          break;
        default:
          throw new Error(`Unsupported chunk type: ${chunk.type}`);
      }

      // Cache the loaded data
      await cache.set(`chunk:${chunk.id}`, data, 3600); // Cache for 1 hour

      chunk.loaded = true;
      chunk.progress = 100;
      chunk.endTime = Date.now();
      
    } catch (error) {
      chunk.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to load chunk ${chunk.id}:`, error);
    }

    this.updateSessionProgress(chunk);
    this.activeLoads.delete(chunk.id);
    this.processLoadingQueue();
  }

  // Load text chunk
  private async loadTextChunk(chunk: LoadingChunk): Promise<string> {
    if (chunk.url.startsWith('data:')) {
      return atob(chunk.url.split(',')[1]);
    }
    
    const response = await fetch(chunk.url);
    if (!response.ok) {
      throw new Error(`Failed to load text: ${response.statusText}`);
    }
    return response.text();
  }

  // Load image chunk
  private async loadImageChunk(chunk: LoadingChunk): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = chunk.url;
    });
  }

  // Load video chunk
  private async loadVideoChunk(chunk: LoadingChunk): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.oncanplaythrough = () => resolve(video);
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = chunk.url;
      video.preload = 'metadata';
    });
  }

  // Load 3D model chunk
  private async load3DModelChunk(chunk: LoadingChunk): Promise<any> {
    // This would integrate with a 3D model loader like Three.js
    const response = await fetch(chunk.url);
    if (!response.ok) {
      throw new Error(`Failed to load 3D model: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  // Load interactive chunk
  private async loadInteractiveChunk(chunk: LoadingChunk): Promise<any> {
    const response = await fetch(chunk.url);
    if (!response.ok) {
      throw new Error(`Failed to load interactive content: ${response.statusText}`);
    }
    return response.json();
  }

  // Update session progress
  private updateSessionProgress(chunk: LoadingChunk): void {
    const session = Array.from(this.sessions.values()).find(s => 
      s.chunks.includes(chunk)
    );
    
    if (session) {
      session.loadedSize = session.chunks
        .filter(c => c.loaded)
        .reduce((sum, c) => sum + c.size, 0);
      
      session.progress = (session.loadedSize / session.totalSize) * 100;
      
      // Check if session is complete
      if (session.chunks.every(c => c.loaded)) {
        session.status = 'completed';
        session.endTime = Date.now();
      }
    }
  }

  // Get session status
  getSessionStatus(sessionId: string): LoadingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Pause loading session
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'loading') {
      session.status = 'paused';
      // Remove chunks from active loading
      session.chunks.forEach(chunk => {
        this.activeLoads.delete(chunk.id);
      });
    }
  }

  // Resume loading session
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      session.status = 'loading';
      // Re-add unloaded chunks to queue
      session.chunks.forEach(chunk => {
        if (!chunk.loaded && !this.loadingQueue.includes(chunk)) {
          this.loadingQueue.push(chunk);
        }
      });
      this.processLoadingQueue();
    }
  }

  // Cancel loading session
  cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      session.endTime = Date.now();
      
      // Remove chunks from active loading and queue
      session.chunks.forEach(chunk => {
        this.activeLoads.delete(chunk.id);
        const index = this.loadingQueue.indexOf(chunk);
        if (index > -1) {
          this.loadingQueue.splice(index, 1);
        }
      });
    }
  }

  // Preload content
  async preloadContent(lessonId: string, priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    // This would preload content in the background
    // Implementation depends on the content structure
    console.log(`Preloading content for lesson ${lessonId} with priority ${priority}`);
  }

  // Get loading statistics
  getLoadingStats(): {
    activeSessions: number;
    totalChunks: number;
    loadedChunks: number;
    activeLoads: number;
    queueLength: number;
    averageLoadTime: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const allChunks = sessions.flatMap(s => s.chunks);
    const loadedChunks = allChunks.filter(c => c.loaded);
    
    const averageLoadTime = loadedChunks.length > 0
      ? loadedChunks.reduce((sum, c) => {
          const loadTime = (c.endTime || 0) - (c.startTime || 0);
          return sum + loadTime;
        }, 0) / loadedChunks.length
      : 0;

    return {
      activeSessions: sessions.filter(s => s.status === 'loading').length,
      totalChunks: allChunks.length,
      loadedChunks: loadedChunks.length,
      activeLoads: this.activeLoads.size,
      queueLength: this.loadingQueue.length,
      averageLoadTime,
    };
  }

  // Cleanup completed sessions
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.endTime && session.endTime < cutoff) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton instance
export const progressiveLoader = new ProgressiveLoadingManager();


export default progressiveLoader;
