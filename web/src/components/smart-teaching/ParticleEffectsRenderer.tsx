'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VisualEffectsEngine } from '@/lib/visual-effects/visual-effects-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Sparkles, 
  Flame, 
  Cloud, 
  Star, 
  Droplets, 
  Snowflake,
  Play,
  Pause,
  RotateCcw,
  //Settings
} from 'lucide-react';

interface ParticleEffectsRendererProps {
  content: {
    title: string;
    effectType: string;
    config: any;
    description?: string;
    learningObjectives?: string[];
  };
  learningStyle?: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onEffectChange?: (effect: string) => void;
  className?: string;
}

export default function ParticleEffectsRenderer({ 
  content, 
  //learningStyle = 'visual',
  onEffectChange, 
  className = '' 
}: ParticleEffectsRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const effectsEngineRef = useRef<VisualEffectsEngine | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEffect, setCurrentEffect] = useState(content.effectType || 'sparkles');
  const [parameters, setParameters] = useState<any>(content.config || {});
  const [particleCount, setParticleCount] = useState(100);

  // Create particle system
  const createParticleSystem = useCallback(() => {
    if (!effectsEngineRef.current) return;

    const effectsEngine = effectsEngineRef.current;
    
    // Clear existing particle systems
    effectsEngine.clearAll();

    // Create new particle system
    effectsEngine.createParticleSystem({
      id: 'main-particles',
      count: particleCount,
      position: new THREE.Vector3(0, 0, 0),
      type: currentEffect as any,
      parameters: {
        ...parameters,
        color: parameters.color || 0xffffff,
        size: parameters.size || 0.1,
        opacity: parameters.opacity || 0.8
      }
    });

    onEffectChange?.(currentEffect);
  }, [currentEffect, parameters, particleCount, onEffectChange]);

    // Initialize particle system
    useEffect(() => {
      if (!canvasRef.current || isInitialized) return;
  
      const canvas = canvasRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  
      renderer.setSize(canvas.width, canvas.height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 1);
  
      // Setup lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);
  
      camera.position.set(0, 0, 5);
      camera.lookAt(0, 0, 0);
  
      const effectsEngine = new VisualEffectsEngine(scene, renderer, camera);
      effectsEngineRef.current = effectsEngine;
  
      // Create initial particle system
      createParticleSystem();
  
      setIsInitialized(true);
  
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        renderer.dispose();
      };
    }, [isInitialized, createParticleSystem]);
    
  // Animation loop
  useEffect(() => {
    if (!isInitialized || !isPlaying) return;

    const animate = () => {
      if (effectsEngineRef.current) {
        effectsEngineRef.current.update();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isInitialized, isPlaying]);

  // Handle parameter changes
  const handleParameterChange = (param: string, value: number | string) => {
    const newParameters = { ...parameters, [param]: value };
    setParameters(newParameters);
  };

  // Handle effect type change
  const handleEffectChange = (effectType: string) => {
    setCurrentEffect(effectType);
  };

  // Get effect icon
  const getEffectIcon = (effectType: string) => {
    switch (effectType) {
      case 'fire': return <Flame className="h-4 w-4" />;
      case 'smoke': return <Cloud className="h-4 w-4" />;
      case 'stars': return <Star className="h-4 w-4" />;
      case 'sparkles': return <Sparkles className="h-4 w-4" />;
      case 'rain': return <Droplets className="h-4 w-4" />;
      case 'snow': return <Snowflake className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  // Get effect description
  const getEffectDescription = (effectType: string) => {
    switch (effectType) {
      case 'fire':
        return 'Simulates fire particles with upward movement and color gradients from red to yellow.';
      case 'smoke':
        return 'Creates smoke-like particles that rise and disperse naturally.';
      case 'stars':
        return 'Generates starfield particles that rotate slowly in 3D space.';
      case 'sparkles':
        return 'Produces bright, twinkling particles with pulsing effects.';
      case 'rain':
        return 'Simulates falling rain particles with realistic physics.';
      case 'snow':
        return 'Creates snow particles that fall gently with slight drift.';
      default:
        return 'Custom particle effect with configurable parameters.';
    }
  };

  // Available effects
  const availableEffects = [
    { type: 'fire', name: 'Fire', color: '#ff4444' },
    { type: 'smoke', name: 'Smoke', color: '#888888' },
    { type: 'stars', name: 'Stars', color: '#4444ff' },
    { type: 'sparkles', name: 'Sparkles', color: '#ffff44' },
    { type: 'rain', name: 'Rain', color: '#4488ff' },
    { type: 'snow', name: 'Snow', color: '#ffffff' }
  ];

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getEffectIcon(currentEffect)}
            <CardTitle>{content.title}</CardTitle>
            <Badge variant="secondary">{currentEffect}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={createParticleSystem}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Particle Canvas */}
        <div 
          ref={containerRef}
          className="relative w-full h-80 bg-black rounded-lg overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: isInitialized ? 'block' : 'none' }}
          />
          {!isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Loading particle system...</p>
              </div>
            </div>
          )}
        </div>

        {/* Effect Description */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          {getEffectDescription(currentEffect)}
        </div>

        {/* Effect Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Particle Effects</label>
          <div className="grid grid-cols-3 gap-2">
            {availableEffects.map(effect => (
              <Button
                key={effect.type}
                size="sm"
                variant={currentEffect === effect.type ? 'default' : 'outline'}
                onClick={() => handleEffectChange(effect.type)}
                className="flex items-center gap-2"
              >
                {getEffectIcon(effect.type)}
                {effect.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <label className="text-sm font-medium">Particle Count</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[particleCount]}
                onValueChange={(value) => setParticleCount(value[0])}
                max={1000}
                min={10}
                step={10}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{particleCount}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Particle Size</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[parameters.size || 0.1]}
                onValueChange={(value) => handleParameterChange('size', value[0])}
                max={1.0}
                min={0.01}
                step={0.01}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{(parameters.size || 0.1).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Opacity</label>
            <div className="flex items-center gap-3">
              <Slider
                value={[parameters.opacity || 0.8]}
                onValueChange={(value) => handleParameterChange('opacity', value[0])}
                max={1.0}
                min={0.1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-12">{(parameters.opacity || 0.8).toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2">
              {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff'].map(color => (
                <button
                  key={color}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                  style={{ backgroundColor: color }}
                  onClick={() => handleParameterChange('color', color)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        {content.learningObjectives && content.learningObjectives.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Learning Objectives</label>
            <ul className="text-sm text-gray-600 space-y-1">
              {content.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{currentEffect} • {particleCount} particles</span>
          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
