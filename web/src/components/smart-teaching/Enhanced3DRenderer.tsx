'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Model3DGenerator } from '@/lib/visual-effects/3d-model-generator';
import { VisualEffectsEngine } from '@/lib/visual-effects/visual-effects-engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
//import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Sparkles,
  //Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface Enhanced3DRendererProps {
  content: {
    title: string;
    visualizationType: string;
    config: any;
    description?: string;
    interactions?: string[];
    narration?: string;
  };
  learningStyle?: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onInteraction?: (interaction: string) => void;
  className?: string;
}

export default function Enhanced3DRenderer({ 
  content, 
  //learningStyle = 'visual',
  onInteraction, 
  className = '' 
}: Enhanced3DRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modelGeneratorRef = useRef<Model3DGenerator | null>(null);
  const effectsEngineRef = useRef<VisualEffectsEngine | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showEffects, setShowEffects] = useState(true);
  const [currentModel, setCurrentModel] = useState<THREE.Object3D | null>(null);
  const [effects, setEffects] = useState<string[]>([]);
  const [parameters, setParameters] = useState<any>(content.config || {});

  // Add particle effects
  const addParticleEffects = useCallback(() => {
    if (!effectsEngineRef.current || !currentModel) return;

    const effectsEngine = effectsEngineRef.current;
    
    // Clear existing particle systems
    effectsEngine.clearAll();

    // Add effects based on visualization type
    switch (content.visualizationType) {
      case 'physics':
        if (parameters.type === 'pendulum') {
          effectsEngine.createParticleSystem({
            id: 'physics-particles',
            count: 50,
            position: new THREE.Vector3(0, -2, 0),
            type: 'sparkles',
            parameters: { color: 0x00ffff }
          });
        }
        break;
      case 'molecule':
        effectsEngine.createParticleSystem({
          id: 'molecule-particles',
          count: 100,
          position: new THREE.Vector3(0, 0, 0),
          type: 'stars',
          parameters: { color: 0xffffff }
        });
        break;
      case 'architecture':
        effectsEngine.createParticleSystem({
          id: 'arch-particles',
          count: 30,
          position: new THREE.Vector3(0, 4, 0),
          type: 'smoke',
          parameters: { color: 0x888888 }
        });
        break;
      default:
        effectsEngine.createParticleSystem({
          id: 'default-particles',
          count: 25,
          position: new THREE.Vector3(0, 0, 0),
          type: 'sparkles',
          parameters: { color: 0x00ff00 }
        });
    }
  }, [content.visualizationType, parameters, currentModel]);


  // Generate 3D model based on content
  const generateModel = useCallback(() => {
      if (!modelGeneratorRef.current) return;
  
      const generator = modelGeneratorRef.current;
      const scene = generator.getScene();
      
      // Clear existing model
      if (currentModel) {
        scene.remove(currentModel);
      }
  
      let model: THREE.Object3D;
  
      switch (content.visualizationType) {
        case 'geometry':
          model = generator.generateGeometryModel(parameters.type || 'cube', parameters);
          break;
        case 'molecule':
          model = generator.generateMoleculeModel(parameters.moleculeData || {});
          break;
        case 'physics':
          model = generator.generatePhysicsModel(parameters.type || 'pendulum', parameters);
          break;
        case 'architecture':
          model = generator.generateArchitectureModel(parameters.type || 'building', parameters);
          break;
        default:
          model = generator.generateGeometryModel('cube', parameters);
      }
  
      // Add visual effects
      if (showEffects && effects.length > 0) {
        generator.addVisualEffects(model, effects);
      }
  
      generator.addToScene(model);
      setCurrentModel(model);
  
      // Add particle effects based on model type
      if (effectsEngineRef.current && showEffects) {
        addParticleEffects();
      }
  }, [content.visualizationType, parameters, showEffects, effects, currentModel, addParticleEffects]);

  // Initialize 3D scene
  useEffect(() => {
        if (!canvasRef.current || isInitialized) return;
    
        const canvas = canvasRef.current;
        const modelGenerator = new Model3DGenerator(canvas);
        const effectsEngine = new VisualEffectsEngine(
          modelGenerator.getScene(),
          modelGenerator.getRenderer(),
          modelGenerator.getCamera()
        );
    
        modelGeneratorRef.current = modelGenerator;
        effectsEngineRef.current = effectsEngine;
    
        // Generate initial model based on content
        generateModel();
    
        setIsInitialized(true);
    
        return () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          modelGenerator.dispose();
        };
  }, [isInitialized, generateModel, addParticleEffects]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !isPlaying) return;

    const animate = () => {
      if (effectsEngineRef.current) {
        effectsEngineRef.current.update();
      }
      if (modelGeneratorRef.current) {
        modelGeneratorRef.current.render();
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

  // Handle effect toggles
  const toggleEffect = (effect: string) => {
    const newEffects = effects.includes(effect)
      ? effects.filter(e => e !== effect)
      : [...effects, effect];
    setEffects(newEffects);
  };

  // Handle interactions
  const handleInteraction = (interaction: string) => {
    onInteraction?.(interaction);
    
    switch (interaction) {
      case 'rotate':
        if (currentModel) {
          currentModel.rotation.y += Math.PI / 4;
        }
        break;
      case 'zoom_in':
        if (modelGeneratorRef.current) {
          const camera = modelGeneratorRef.current.getCamera();
          camera.position.multiplyScalar(0.9);
        }
        break;
      case 'zoom_out':
        if (modelGeneratorRef.current) {
          const camera = modelGeneratorRef.current.getCamera();
          camera.position.multiplyScalar(1.1);
        }
        break;
      case 'reset':
        if (modelGeneratorRef.current) {
          const camera = modelGeneratorRef.current.getCamera();
          camera.position.set(0, 0, 5);
          camera.lookAt(0, 0, 0);
        }
        if (currentModel) {
          currentModel.rotation.set(0, 0, 0);
        }
        break;
    }
  };

  // Render parameter controls
  const renderParameterControls = () => {
    if (!showControls) return null;

    const controls: React.ReactElement[] = [];

    // Geometry controls
    if (content.visualizationType === 'geometry') {
      controls.push(
        <div key="geometry-type" className="space-y-2">
          <label className="text-sm font-medium">Shape Type</label>
          <div className="flex gap-2">
            {['cube', 'sphere', 'cylinder', 'cone', 'torus', 'plane'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={parameters.type === type ? 'default' : 'outline'}
                onClick={() => handleParameterChange('type', type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      );

      controls.push(
        <div key="color" className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <div className="flex gap-2">
            {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
              <button
                key={color}
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: color }}
                onClick={() => handleParameterChange('color', color)}
              />
            ))}
          </div>
        </div>
      );
    }

    // Physics controls
    if (content.visualizationType === 'physics') {
      controls.push(
        <div key="physics-type" className="space-y-2">
          <label className="text-sm font-medium">Physics Type</label>
          <div className="flex gap-2">
            {['pendulum', 'spring', 'wave'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={parameters.type === type ? 'default' : 'outline'}
                onClick={() => handleParameterChange('type', type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    // Architecture controls
    if (content.visualizationType === 'architecture') {
      controls.push(
        <div key="arch-type" className="space-y-2">
          <label className="text-sm font-medium">Structure Type</label>
          <div className="flex gap-2">
            {['building', 'bridge'].map(type => (
              <Button
                key={type}
                size="sm"
                variant={parameters.type === type ? 'default' : 'outline'}
                onClick={() => handleParameterChange('type', type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return controls;
  };

  // Render effect controls
  const renderEffectControls = () => {
    if (!showEffects) return null;

    const availableEffects = ['glow', 'particles', 'outline', 'pulse'];

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Visual Effects</label>
        <div className="flex gap-2 flex-wrap">
          {availableEffects.map(effect => (
            <Button
              key={effect}
              size="sm"
              variant={effects.includes(effect) ? 'default' : 'outline'}
              onClick={() => toggleEffect(effect)}
            >
              {effect}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move3D className="h-5 w-5 text-blue-500" />
            <CardTitle>{content.title}</CardTitle>
            <Badge variant="secondary">{content.visualizationType}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEffects(!showEffects)}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 3D Canvas */}
        <div 
          ref={containerRef}
          className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden"
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
                <p>Loading 3D visualization...</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {content.description && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {content.description}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Parameter Controls */}
            {renderParameterControls()}
            
            {/* Effect Controls */}
            {renderEffectControls()}
            
            {/* Interaction Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Interactions</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInteraction('rotate')}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Rotate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInteraction('zoom_in')}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Zoom In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInteraction('zoom_out')}
                >
                  <ZoomOut className="h-4 w-4 mr-1" />
                  Zoom Out
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleInteraction('reset')}
                >
                  Reset View
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? 'default' : 'outline'}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={generateModel}
            >
              Regenerate
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            {content.visualizationType} • {effects.length} effects
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
