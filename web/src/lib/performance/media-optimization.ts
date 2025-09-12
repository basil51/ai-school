// Media optimization utilities for performance
export interface MediaOptimizationConfig {
  imageQuality: number; // 0-1
  imageFormat: 'webp' | 'jpeg' | 'png' | 'avif';
  videoQuality: number; // 0-1
  videoFormat: 'mp4' | 'webm' | 'av1';
  audioQuality: number; // 0-1
  audioFormat: 'mp3' | 'aac' | 'opus';
  maxWidth: number;
  maxHeight: number;
  enableLazyLoading: boolean;
  enableProgressiveLoading: boolean;
}

export interface OptimizedMedia {
  originalUrl: string;
  optimizedUrl: string;
  format: string;
  size: number;
  originalSize: number;
  compressionRatio: number;
  width?: number;
  height?: number;
  duration?: number; // for video/audio
}

export interface MediaOptimizationResult {
  success: boolean;
  optimizedMedia?: OptimizedMedia;
  error?: string;
  processingTime: number;
}

// Media optimization manager
export class MediaOptimizationManager {
  private config: MediaOptimizationConfig;
  private optimizationCache = new Map<string, OptimizedMedia>();

  constructor(config: Partial<MediaOptimizationConfig> = {}) {
    this.config = {
      imageQuality: 0.8,
      imageFormat: 'webp',
      videoQuality: 0.7,
      videoFormat: 'mp4',
      audioQuality: 0.8,
      audioFormat: 'mp3',
      maxWidth: 1920,
      maxHeight: 1080,
      enableLazyLoading: true,
      enableProgressiveLoading: true,
      ...config,
    };
  }

  // Optimize image
  async optimizeImage(
    file: File | string,
    customConfig?: Partial<MediaOptimizationConfig>
  ): Promise<MediaOptimizationResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };

    try {
      let imageFile: File;
      
      if (typeof file === 'string') {
        // Convert URL to File
        const response = await fetch(file);
        const blob = await response.blob();
        imageFile = new File([blob], 'image', { type: blob.type });
      } else {
        imageFile = file;
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(imageFile, config);
      const cached = this.optimizationCache.get(cacheKey);
      if (cached) {
        return {
          success: true,
          optimizedMedia: cached,
          processingTime: Date.now() - startTime,
        };
      }

      // Create canvas for image processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image
      const img = await this.loadImage(imageFile);
      
      // Calculate optimized dimensions
      const { width, height } = this.calculateOptimalDimensions(
        img.width,
        img.height,
        config.maxWidth,
        config.maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      // Draw and optimize image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to optimized format
      const optimizedBlob = await this.canvasToBlob(
        canvas,
        config.imageFormat,
        config.imageQuality
      );

      const optimizedMedia: OptimizedMedia = {
        originalUrl: typeof file === 'string' ? file : URL.createObjectURL(file),
        optimizedUrl: URL.createObjectURL(optimizedBlob),
        format: config.imageFormat,
        size: optimizedBlob.size,
        originalSize: imageFile.size,
        compressionRatio: optimizedBlob.size / imageFile.size,
        width,
        height,
      };

      // Cache the result
      this.optimizationCache.set(cacheKey, optimizedMedia);

      return {
        success: true,
        optimizedMedia,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // Optimize video
  async optimizeVideo(
    file: File | string,
    customConfig?: Partial<MediaOptimizationConfig>
  ): Promise<MediaOptimizationResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };

    try {
      // For video optimization, we would typically use FFmpeg or similar
      // This is a simplified implementation that returns the original file
      // In a real implementation, you would use a video processing library
      
      let videoFile: File;
      
      if (typeof file === 'string') {
        const response = await fetch(file);
        const blob = await response.blob();
        videoFile = new File([blob], 'video', { type: blob.type });
      } else {
        videoFile = file;
      }

      // Get video metadata
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      const optimizedMedia: OptimizedMedia = {
        originalUrl: typeof file === 'string' ? file : URL.createObjectURL(file),
        optimizedUrl: URL.createObjectURL(videoFile), // In real implementation, this would be the optimized version
        format: config.videoFormat,
        size: videoFile.size,
        originalSize: videoFile.size,
        compressionRatio: 1, // Would be calculated from actual optimization
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };

      return {
        success: true,
        optimizedMedia,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // Optimize audio
  async optimizeAudio(
    file: File | string,
    customConfig?: Partial<MediaOptimizationConfig>
  ): Promise<MediaOptimizationResult> {
    const startTime = Date.now();
    const config = { ...this.config, ...customConfig };

    try {
      // Similar to video, audio optimization would use specialized libraries
      // This is a simplified implementation
      
      let audioFile: File;
      
      if (typeof file === 'string') {
        const response = await fetch(file);
        const blob = await response.blob();
        audioFile = new File([blob], 'audio', { type: blob.type });
      } else {
        audioFile = file;
      }

      // Get audio metadata
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(audioFile);
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
      });

      const optimizedMedia: OptimizedMedia = {
        originalUrl: typeof file === 'string' ? file : URL.createObjectURL(file),
        optimizedUrl: URL.createObjectURL(audioFile), // In real implementation, this would be the optimized version
        format: config.audioFormat,
        size: audioFile.size,
        originalSize: audioFile.size,
        compressionRatio: 1, // Would be calculated from actual optimization
        duration: audio.duration,
      };

      return {
        success: true,
        optimizedMedia,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      };
    }
  }

  // Batch optimize media files
  async batchOptimize(
    files: (File | string)[],
    customConfig?: Partial<MediaOptimizationConfig>
  ): Promise<MediaOptimizationResult[]> {
    const results: MediaOptimizationResult[] = [];
    
    // Process files in parallel (with concurrency limit)
    const concurrency = 3;
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(file => this.optimizeMedia(file, customConfig))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  // Auto-detect media type and optimize
  async optimizeMedia(
    file: File | string,
    customConfig?: Partial<MediaOptimizationConfig>
  ): Promise<MediaOptimizationResult> {
    const config = { ...this.config, ...customConfig };
    
    let mediaFile: File;
    if (typeof file === 'string') {
      const response = await fetch(file);
      const blob = await response.blob();
      mediaFile = new File([blob], 'media', { type: blob.type });
    } else {
      mediaFile = file;
    }

    const mimeType = mediaFile.type;
    
    if (mimeType.startsWith('image/')) {
      return this.optimizeImage(mediaFile, customConfig);
    } else if (mimeType.startsWith('video/')) {
      return this.optimizeVideo(mediaFile, customConfig);
    } else if (mimeType.startsWith('audio/')) {
      return this.optimizeAudio(mediaFile, customConfig);
    } else {
      return {
        success: false,
        error: `Unsupported media type: ${mimeType}`,
        processingTime: 0,
      };
    }
  }

  // Helper methods
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateOptimalDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Scale down if necessary
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        `image/${format}`,
        quality
      );
    });
  }

  private generateCacheKey(file: File, config: MediaOptimizationConfig): string {
    const fileInfo = `${file.name}_${file.size}_${file.lastModified}`;
    const configInfo = `${config.imageQuality}_${config.imageFormat}_${config.maxWidth}_${config.maxHeight}`;
    return `${fileInfo}_${configInfo}`;
  }

  // Get optimization statistics
  getOptimizationStats(): {
    cacheSize: number;
    totalOptimizations: number;
    averageCompressionRatio: number;
    totalSpaceSaved: number;
  } {
    const optimizations = Array.from(this.optimizationCache.values());
    const totalOptimizations = optimizations.length;
    const averageCompressionRatio = totalOptimizations > 0
      ? optimizations.reduce((sum, opt) => sum + opt.compressionRatio, 0) / totalOptimizations
      : 0;
    const totalSpaceSaved = optimizations.reduce(
      (sum, opt) => sum + (opt.originalSize - opt.size),
      0
    );

    return {
      cacheSize: this.optimizationCache.size,
      totalOptimizations,
      averageCompressionRatio,
      totalSpaceSaved,
    };
  }

  // Clear optimization cache
  clearCache(): void {
    // Revoke object URLs to free memory
    for (const optimization of this.optimizationCache.values()) {
      URL.revokeObjectURL(optimization.optimizedUrl);
    }
    this.optimizationCache.clear();
  }

  // Update configuration
  updateConfig(newConfig: Partial<MediaOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const mediaOptimizer = new MediaOptimizationManager();

// Utility functions
export const optimizeImageForWeb = async (
  file: File | string,
  quality: number = 0.8,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<MediaOptimizationResult> => {
  return mediaOptimizer.optimizeImage(file, {
    imageQuality: quality,
    imageFormat: 'webp',
    maxWidth,
    maxHeight,
  });
};

export const optimizeVideoForWeb = async (
  file: File | string,
  quality: number = 0.7
): Promise<MediaOptimizationResult> => {
  return mediaOptimizer.optimizeVideo(file, {
    videoQuality: quality,
    videoFormat: 'mp4',
  });
};

export const optimizeAudioForWeb = async (
  file: File | string,
  quality: number = 0.8
): Promise<MediaOptimizationResult> => {
  return mediaOptimizer.optimizeAudio(file, {
    audioQuality: quality,
    audioFormat: 'mp3',
  });
};

export default mediaOptimizer;
