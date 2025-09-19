// 3D rendering optimization utilities
export interface LODConfig {
  distances: number[]; // Distance thresholds for each LOD level
  qualityLevels: number[]; // Quality levels (0-1) for each LOD
  autoAdjust: boolean; // Automatically adjust based on performance
  minFPS: number; // Minimum FPS threshold
  maxFPS: number; // Maximum FPS threshold
}

export interface RenderingConfig {
  enableLOD: boolean;
  enableFrustumCulling: boolean;
  enableOcclusionCulling: boolean;
  enableInstancing: boolean;
  maxDrawCalls: number;
  maxTriangles: number;
  targetFPS: number;
  adaptiveQuality: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  gpuMemoryUsage?: number;
}

export interface LODLevel {
  level: number;
  distance: number;
  quality: number;
  mesh: any; // 3D mesh object
  texture: any; // Texture object
  isActive: boolean;
}

// 3D optimization manager
export class ThreeDOptimizationManager {
  private lodConfig: LODConfig;
  private renderingConfig: RenderingConfig;
  private performanceMetrics: PerformanceMetrics;
  private lodLevels = new Map<string, LODLevel[]>();
  private performanceHistory: PerformanceMetrics[] = [];
  private adaptiveQualityEnabled: boolean = true;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsUpdateInterval: number = 1000; // Update FPS every second
  private lastFpsUpdate: number = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastQualityLogTime: number = 0;
  private qualityLogThrottle: number = 5000; // Only log quality changes every 5 seconds

  constructor(
    lodConfig: Partial<LODConfig> = {},
    renderingConfig: Partial<RenderingConfig> = {}
  ) {
    this.lodConfig = {
      distances: [10, 25, 50, 100], // Distance thresholds
      qualityLevels: [1.0, 0.7, 0.4, 0.2], // Quality levels
      autoAdjust: true,
      minFPS: 30,
      maxFPS: 60,
      ...lodConfig,
    };

    this.renderingConfig = {
      enableLOD: true,
      enableFrustumCulling: true,
      enableOcclusionCulling: true,
      enableInstancing: true,
      maxDrawCalls: 1000,
      maxTriangles: 1000000,
      targetFPS: 60,
      adaptiveQuality: true,
      ...renderingConfig,
    };

    this.performanceMetrics = {
      fps: 60,
      frameTime: 16.67, // 60 FPS = 16.67ms per frame
      drawCalls: 0,
      triangles: 0,
      memoryUsage: 0,
    };

    // Only start monitoring in browser environment, not during build
    if (typeof window !== 'undefined') {
      this.startPerformanceMonitoring();
    }
  }

  // Create LOD levels for a 3D object
  createLODLevels(
    objectId: string,
    meshes: any[],
    textures: any[] = []
  ): LODLevel[] {
    const lodLevels: LODLevel[] = [];

    for (let i = 0; i < this.lodConfig.distances.length; i++) {
      const lodLevel: LODLevel = {
        level: i,
        distance: this.lodConfig.distances[i],
        quality: this.lodConfig.qualityLevels[i],
        mesh: meshes[i] || meshes[0], // Fallback to first mesh
        texture: textures[i] || textures[0], // Fallback to first texture
        isActive: i === 0, // Only first level is active initially
      };
      lodLevels.push(lodLevel);
    }

    this.lodLevels.set(objectId, lodLevels);
    return lodLevels;
  }

  // Update LOD based on camera distance
  updateLOD(objectId: string, cameraPosition: any, objectPosition: any): void {
    if (!this.renderingConfig.enableLOD) return;

    const lodLevels = this.lodLevels.get(objectId);
    if (!lodLevels) return;

    // Calculate distance from camera to object
    const distance = this.calculateDistance(cameraPosition, objectPosition);

    // Find appropriate LOD level
    let activeLevel = 0;
    for (let i = 0; i < lodLevels.length; i++) {
      if (distance <= lodLevels[i].distance) {
        activeLevel = i;
        break;
      }
    }

    // Activate the appropriate LOD level
    lodLevels.forEach((level, index) => {
      level.isActive = index === activeLevel;
    });
  }

  // Adaptive quality adjustment based on performance
  adjustQualityBasedOnPerformance(): void {
    if (!this.renderingConfig.adaptiveQuality) return;

    const currentFPS = this.performanceMetrics.fps;
    //const targetFPS = this.renderingConfig.targetFPS;

    if (currentFPS < this.lodConfig.minFPS) {
      // Performance is poor, reduce quality
      this.reduceQuality();
    } else if (currentFPS > this.lodConfig.maxFPS) {
      // Performance is good, can increase quality
      this.increaseQuality();
    }
  }

  // Reduce rendering quality
  private reduceQuality(): void {
    // Increase LOD distances (objects switch to lower quality sooner)
    this.lodConfig.distances = this.lodConfig.distances.map(d => d * 0.8);
    
    // Reduce quality levels
    this.lodConfig.qualityLevels = this.lodConfig.qualityLevels.map(q => Math.max(0.1, q * 0.9));
    
    // Reduce max draw calls and triangles
    this.renderingConfig.maxDrawCalls = Math.max(100, this.renderingConfig.maxDrawCalls * 0.8);
    this.renderingConfig.maxTriangles = Math.max(10000, this.renderingConfig.maxTriangles * 0.8);
    
    this.logQualityChange('Reduced 3D rendering quality due to poor performance');
  }

  // Increase rendering quality
  private increaseQuality(): void {
    // Decrease LOD distances (objects maintain higher quality longer)
    this.lodConfig.distances = this.lodConfig.distances.map(d => d * 1.1);
    
    // Increase quality levels
    this.lodConfig.qualityLevels = this.lodConfig.qualityLevels.map(q => Math.min(1.0, q * 1.1));
    
    // Increase max draw calls and triangles
    this.renderingConfig.maxDrawCalls = Math.min(2000, this.renderingConfig.maxDrawCalls * 1.1);
    this.renderingConfig.maxTriangles = Math.min(2000000, this.renderingConfig.maxTriangles * 1.1);
    
    this.logQualityChange('Increased 3D rendering quality due to good performance');
  }

  // Frustum culling - remove objects outside camera view
  performFrustumCulling(objects: any[], camera: any): any[] {
    if (!this.renderingConfig.enableFrustumCulling) return objects;
    console.log(camera);
    return objects.filter(() => {
      // This would contain actual frustum culling logic
      // For now, return all objects
      return true;
    });
  }

  // Occlusion culling - remove objects hidden behind others
  performOcclusionCulling(objects: any[], camera: any): any[] {
    if (!this.renderingConfig.enableOcclusionCulling) return objects;
    console.log(camera);
    // This would contain actual occlusion culling logic
    // For now, return all objects
    return objects;
  }

  // Instance rendering for repeated objects
  createInstancedMesh(objects: any[]): any {
    console.log(objects);
    if (!this.renderingConfig.enableInstancing) return null;

    // This would create an instanced mesh for repeated objects
    // For now, return null
    return null;
  }

  // Update performance metrics
  updatePerformanceMetrics(
    drawCalls: number,
    triangles: number,
    memoryUsage: number,
    gpuMemoryUsage?: number
  ): void {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    this.frameCount++;

    // Update FPS
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.performanceMetrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Update other metrics
    this.performanceMetrics.frameTime = deltaTime;
    this.performanceMetrics.drawCalls = drawCalls;
    this.performanceMetrics.triangles = triangles;
    this.performanceMetrics.memoryUsage = memoryUsage;
    if (gpuMemoryUsage !== undefined) {
      this.performanceMetrics.gpuMemoryUsage = gpuMemoryUsage;
    }

    // Add to history
    this.performanceHistory.push({ ...this.performanceMetrics });
    
    // Keep only recent history
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }

    // Adjust quality if needed
    this.adjustQualityBasedOnPerformance();
  }

  // Start performance monitoring
  private startPerformanceMonitoring(): void {
    // Only start if not already running
    if (this.monitoringInterval) return;
    
    const monitor = () => {
      // This would integrate with the actual 3D rendering engine
      // For now, we'll simulate some metrics
      this.updatePerformanceMetrics(
        Math.floor(Math.random() * 1000),
        Math.floor(Math.random() * 100000),
        typeof process !== 'undefined' ? process.memoryUsage().heapUsed : 0
      );
    };

    // Monitor every frame (60 FPS) - but only in browser
    this.monitoringInterval = setInterval(monitor, 16.67);
  }

  // Stop performance monitoring
  stopPerformanceMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Throttled logging for quality changes
  private logQualityChange(message: string): void {
    const now = Date.now();
    if (now - this.lastQualityLogTime > this.qualityLogThrottle) {
      console.log(message);
      this.lastQualityLogTime = now;
    }
  }

  // Get current performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // Get performance history
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  // Get average performance over time period
  getAveragePerformance(timeWindow: number = 5000): PerformanceMetrics {
    const now = performance.now();
    const recentMetrics = this.performanceHistory.filter(
      m => now - m.frameTime <= timeWindow
    );

    if (recentMetrics.length === 0) {
      return this.performanceMetrics;
    }

    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    const avgFrameTime = recentMetrics.reduce((sum, m) => sum + m.frameTime, 0) / recentMetrics.length;
    const avgDrawCalls = recentMetrics.reduce((sum, m) => sum + m.drawCalls, 0) / recentMetrics.length;
    const avgTriangles = recentMetrics.reduce((sum, m) => sum + m.triangles, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;

    return {
      fps: Math.round(avgFPS),
      frameTime: avgFrameTime,
      drawCalls: Math.round(avgDrawCalls),
      triangles: Math.round(avgTriangles),
      memoryUsage: Math.round(avgMemoryUsage),
    };
  }

  // Check if performance is within acceptable limits
  isPerformanceAcceptable(): boolean {
    return (
      this.performanceMetrics.fps >= this.lodConfig.minFPS &&
      this.performanceMetrics.drawCalls <= this.renderingConfig.maxDrawCalls &&
      this.performanceMetrics.triangles <= this.renderingConfig.maxTriangles
    );
  }

  // Get optimization recommendations
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.performanceMetrics;

    if (metrics.fps < this.lodConfig.minFPS) {
      recommendations.push('Consider reducing LOD distances or quality levels');
      recommendations.push('Enable more aggressive culling techniques');
      recommendations.push('Reduce maximum draw calls and triangles');
    }

    if (metrics.drawCalls > this.renderingConfig.maxDrawCalls * 0.8) {
      recommendations.push('Consider using instanced rendering for repeated objects');
      recommendations.push('Combine multiple objects into single draw calls');
    }

    if (metrics.triangles > this.renderingConfig.maxTriangles * 0.8) {
      recommendations.push('Use lower-polygon models for distant objects');
      recommendations.push('Implement more aggressive LOD switching');
    }

    if (metrics.memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Consider reducing texture resolution');
      recommendations.push('Implement texture streaming for large scenes');
    }

    return recommendations;
  }

  // Update configuration
  updateLODConfig(newConfig: Partial<LODConfig>): void {
    this.lodConfig = { ...this.lodConfig, ...newConfig };
  }

  updateRenderingConfig(newConfig: Partial<RenderingConfig>): void {
    this.renderingConfig = { ...this.renderingConfig, ...newConfig };
  }

  // Utility function to calculate distance
  private calculateDistance(pos1: any, pos2: any): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Cleanup
  destroy(): void {
    this.lodLevels.clear();
    this.performanceHistory = [];
  }
}

// Singleton instance
export const threeDOptimizer = new ThreeDOptimizationManager();

// Utility functions
export const createOptimizedLODLevels = (
  objectId: string,
  meshes: any[],
  textures: any[] = []
): LODLevel[] => {
  return threeDOptimizer.createLODLevels(objectId, meshes, textures);
};

export const updateObjectLOD = (
  objectId: string,
  cameraPosition: any,
  objectPosition: any
): void => {
  threeDOptimizer.updateLOD(objectId, cameraPosition, objectPosition);
};

export const getPerformanceMetrics = (): PerformanceMetrics => {
  return threeDOptimizer.getPerformanceMetrics();
};

export const isPerformanceAcceptable = (): boolean => {
  return threeDOptimizer.isPerformanceAcceptable();
};

export default threeDOptimizer;
