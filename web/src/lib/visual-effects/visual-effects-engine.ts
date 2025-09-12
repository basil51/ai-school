import * as THREE from 'three';

export interface VisualEffect {
  id: string;
  type: 'particle' | 'animation' | 'transition' | 'lighting' | 'postprocessing';
  name: string;
  parameters: any;
  duration?: number;
  loop?: boolean;
  autoStart?: boolean;
}

export interface ParticleSystem {
  id: string;
  count: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  system: THREE.Points;
  animation?: {
    type: 'float' | 'rotate' | 'pulse' | 'custom';
    speed: number;
    amplitude?: number;
  };
}

export interface AnimationEffect {
  id: string;
  target: THREE.Object3D;
  type: 'rotation' | 'translation' | 'scale' | 'morph' | 'custom';
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
  keyframes: Keyframe[];
  loop: boolean;
  delay?: number;
}

export interface Keyframe {
  time: number; // 0 to 1
  value: any;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
}

export interface TransitionEffect {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'flip' | 'custom';
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
  from: any;
  to: any;
  target: THREE.Object3D;
}

export class VisualEffectsEngine {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private effects: Map<string, VisualEffect> = new Map();
  private particleSystems: Map<string, ParticleSystem> = new Map();
  private animations: Map<string, AnimationEffect> = new Map();
  private transitions: Map<string, TransitionEffect> = new Map();
  private clock: THREE.Clock = new THREE.Clock();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
  }

  // Particle System Effects
  createParticleSystem(config: {
    id: string;
    count: number;
    position: THREE.Vector3;
    type: 'fire' | 'smoke' | 'stars' | 'sparkles' | 'rain' | 'snow' | 'custom';
    parameters?: any;
  }): ParticleSystem {
    const { id, count, position, type, parameters = {} } = config;
    
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let animation: any;

    switch (type) {
      case 'fire':
        geometry = this.createFireGeometry(count, parameters);
        material = this.createFireMaterial(parameters);
        animation = { type: 'float', speed: 0.02, amplitude: 0.5 };
        break;

      case 'smoke':
        geometry = this.createSmokeGeometry(count, parameters);
        material = this.createSmokeMaterial(parameters);
        animation = { type: 'float', speed: 0.01, amplitude: 0.3 };
        break;

      case 'stars':
        geometry = this.createStarsGeometry(count, parameters);
        material = this.createStarsMaterial(parameters);
        animation = { type: 'rotate', speed: 0.005 };
        break;

      case 'sparkles':
        geometry = this.createSparklesGeometry(count, parameters);
        material = this.createSparklesMaterial(parameters);
        animation = { type: 'pulse', speed: 0.03, amplitude: 0.2 };
        break;

      case 'rain':
        geometry = this.createRainGeometry(count, parameters);
        material = this.createRainMaterial(parameters);
        animation = { type: 'float', speed: 0.05, amplitude: 1.0 };
        break;

      case 'snow':
        geometry = this.createSnowGeometry(count, parameters);
        material = this.createSnowMaterial(parameters);
        animation = { type: 'float', speed: 0.01, amplitude: 0.8 };
        break;

      default:
        geometry = this.createCustomGeometry(count, parameters);
        material = this.createCustomMaterial(parameters);
        animation = { type: 'float', speed: 0.01, amplitude: 0.1 };
    }

    const system = new THREE.Points(geometry, material);
    system.position.copy(position);

    const particleSystem: ParticleSystem = {
      id,
      count,
      geometry,
      material,
      system,
      animation
    };

    this.particleSystems.set(id, particleSystem);
    this.scene.add(system);

    return particleSystem;
  }

  private createFireGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Position (cone shape for fire)
      positions[i3] = (Math.random() - 0.5) * 2;
      positions[i3 + 1] = Math.random() * 3;
      positions[i3 + 2] = (Math.random() - 0.5) * 2;

      // Color (red to yellow gradient)
      const color = new THREE.Color();
      color.setHSL(0.1 + Math.random() * 0.1, 1, 0.5 + Math.random() * 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Size
      sizes[i] = 0.1 + Math.random() * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }

  private createFireMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
  }

  private createSmokeGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 4;
      positions[i3 + 1] = Math.random() * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;

      const gray = 0.3 + Math.random() * 0.4;
      colors[i3] = gray;
      colors[i3 + 1] = gray;
      colors[i3 + 2] = gray;

      sizes[i] = 0.5 + Math.random() * 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }

  private createSmokeMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });
  }

  private createStarsGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random positions in a sphere
      const radius = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // White to blue stars
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.5, 0.8 + Math.random() * 0.2);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }

  private createStarsMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: false
    });
  }

  private createSparklesGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 6;
      positions[i3 + 1] = (Math.random() - 0.5) * 6;
      positions[i3 + 2] = (Math.random() - 0.5) * 6;

      // Bright colors
      const color = new THREE.Color();
      color.setHSL(Math.random(), 1, 0.5 + Math.random() * 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }

  private createSparklesMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
  }

  private createRainGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = Math.random() * 10 + 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      // Blue-gray color
      colors[i3] = 0.4;
      colors[i3 + 1] = 0.6;
      colors[i3 + 2] = 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }

  private createRainMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });
  }

  private createSnowGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = Math.random() * 10 + 5;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      // White color
      colors[i3] = 1;
      colors[i3 + 1] = 1;
      colors[i3 + 2] = 1;

      sizes[i] = 0.1 + Math.random() * 0.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    return geometry;
  }

  private createSnowMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });
  }

  private createCustomGeometry(count: number, parameters: any): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 4;
      positions[i3 + 1] = (Math.random() - 0.5) * 4;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;

      const color = new THREE.Color(parameters.color || 0xffffff);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }

  private createCustomMaterial(parameters: any): THREE.Material {
    return new THREE.PointsMaterial({
      size: parameters.size || 0.1,
      vertexColors: true,
      transparent: true,
      opacity: parameters.opacity || 0.8,
      blending: THREE.NormalBlending,
      sizeAttenuation: true
    });
  }

  // Animation Effects
  createAnimation(config: {
    id: string;
    target: THREE.Object3D;
    type: 'rotation' | 'translation' | 'scale' | 'morph' | 'custom';
    duration: number;
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
    keyframes: Keyframe[];
    loop?: boolean;
    delay?: number;
  }): AnimationEffect {
    const { id, target, type, duration, easing = 'easeInOut', keyframes, loop = false, delay = 0 } = config;

    const animation: AnimationEffect = {
      id,
      target,
      type,
      duration,
      easing,
      keyframes,
      loop,
      delay
    };

    this.animations.set(id, animation);
    return animation;
  }

  // Transition Effects
  createTransition(config: {
    id: string;
    type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'flip' | 'custom';
    duration: number;
    easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';
    from: any;
    to: any;
    target: THREE.Object3D;
  }): TransitionEffect {
    const { id, type, duration, easing = 'easeInOut', from, to, target } = config;

    const transition: TransitionEffect = {
      id,
      type,
      duration,
      easing,
      from,
      to,
      target
    };

    this.transitions.set(id, transition);
    return transition;
  }

  // Lighting Effects
  createLightingEffect(config: {
    id: string;
    type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
    position?: THREE.Vector3;
    color?: number;
    intensity?: number;
    parameters?: any;
  }): THREE.Light {
    const { id, type, position = new THREE.Vector3(0, 0, 0), color = 0xffffff, intensity = 1, parameters = {} } = config;

    let light: THREE.Light;

    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(color, intensity);
        break;
      case 'directional':
        light = new THREE.DirectionalLight(color, intensity);
        light.position.copy(position);
        break;
      case 'point':
        light = new THREE.PointLight(color, intensity, parameters.distance || 100);
        light.position.copy(position);
        break;
      case 'spot':
        light = new THREE.SpotLight(color, intensity, parameters.distance || 100, parameters.angle || Math.PI / 3, parameters.penumbra || 0.1);
        light.position.copy(position);
        break;
      case 'hemisphere':
        light = new THREE.HemisphereLight(color, parameters.groundColor || 0x444444, intensity);
        break;
      default:
        light = new THREE.AmbientLight(color, intensity);
    }

    this.scene.add(light);
    return light;
  }

  // Update all effects
  update(): void {
    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Update particle systems
    this.particleSystems.forEach((particleSystem) => {
      this.updateParticleSystem(particleSystem, deltaTime, elapsedTime);
    });

    // Update animations
    this.animations.forEach((animation) => {
      this.updateAnimation(animation, deltaTime, elapsedTime);
    });

    // Update transitions
    this.transitions.forEach((transition) => {
      this.updateTransition(transition, deltaTime, elapsedTime);
    });
  }

  private updateParticleSystem(particleSystem: ParticleSystem, deltaTime: number, elapsedTime: number): void {
    if (!particleSystem.animation) return;

    const positions = particleSystem.geometry.attributes.position.array as Float32Array;
    const { type, speed, amplitude = 1 } = particleSystem.animation;

    for (let i = 0; i < particleSystem.count; i++) {
      const i3 = i * 3;

      switch (type) {
        case 'float':
          positions[i3 + 1] += Math.sin(elapsedTime * speed + i) * amplitude * deltaTime;
          break;
        case 'rotate':
          const angle = elapsedTime * speed;
          const x = positions[i3];
          const z = positions[i3 + 2];
          positions[i3] = x * Math.cos(angle) - z * Math.sin(angle);
          positions[i3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
          break;
        case 'pulse':
          const scale = 1 + Math.sin(elapsedTime * speed + i) * amplitude;
          positions[i3] *= scale;
          positions[i3 + 1] *= scale;
          positions[i3 + 2] *= scale;
          break;
      }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  private updateAnimation(animation: AnimationEffect, deltaTime: number, elapsedTime: number): void {
    // Implementation for animation updates
    // This would handle keyframe interpolation and easing
  }

  private updateTransition(transition: TransitionEffect, deltaTime: number, elapsedTime: number): void {
    // Implementation for transition updates
    // This would handle smooth transitions between states
  }

  // Remove effects
  removeEffect(id: string): void {
    this.effects.delete(id);
  }

  removeParticleSystem(id: string): void {
    const particleSystem = this.particleSystems.get(id);
    if (particleSystem) {
      this.scene.remove(particleSystem.system);
      this.particleSystems.delete(id);
    }
  }

  removeAnimation(id: string): void {
    this.animations.delete(id);
  }

  removeTransition(id: string): void {
    this.transitions.delete(id);
  }

  // Clear all effects
  clearAll(): void {
    this.particleSystems.forEach((particleSystem) => {
      this.scene.remove(particleSystem.system);
    });
    this.particleSystems.clear();
    this.animations.clear();
    this.transitions.clear();
    this.effects.clear();
  }

  // Get effect by ID
  getEffect(id: string): VisualEffect | undefined {
    return this.effects.get(id);
  }

  getParticleSystem(id: string): ParticleSystem | undefined {
    return this.particleSystems.get(id);
  }

  getAnimation(id: string): AnimationEffect | undefined {
    return this.animations.get(id);
  }

  getTransition(id: string): TransitionEffect | undefined {
    return this.transitions.get(id);
  }
}
