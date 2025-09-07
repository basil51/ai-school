"use client";
import React, { useRef, useEffect, useState } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, Color4, Mesh } from '@babylonjs/core';

type BabylonJSVisualizerProps = {
  type: 'advanced-3d' | 'physics-engine' | 'materials' | 'animations';
  config?: {
    scene?: {
      backgroundColor?: string;
      gravity?: boolean;
    };
    object?: {
      shape: 'box' | 'sphere' | 'cylinder' | 'plane' | 'torus';
      material?: {
        color?: string;
        metallic?: boolean;
        roughness?: number;
      };
    };
    physics?: {
      enabled: boolean;
      gravity?: number;
    };
  };
  width?: number;
  height?: number;
};

export default function BabylonJSVisualizer({ 
  type, 
  config = {}, 
  width = 400, 
  height = 300 
}: BabylonJSVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Babylon.js engine
    const engine = new Engine(canvasRef.current, true);
    engineRef.current = engine;

    // Create scene
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Set background color
    const { backgroundColor = '#f8fafc' } = config.scene || {};
    scene.clearColor = new Color4(0.97, 0.98, 0.99, 1.0); // #f8fafc

    // Create camera
    const camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2.5,
      10,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    // Create light
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Create content based on type
    createContent(scene, type, config);

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [type, config, width, height]);

  const createContent = (scene: Scene, type: string, config: any) => {
    switch (type) {
      case 'advanced-3d':
        createAdvanced3DScene(scene, config);
        break;
      case 'physics-engine':
        createPhysicsScene(scene, config);
        break;
      case 'materials':
        createMaterialsScene(scene, config);
        break;
      case 'animations':
        createAnimationScene(scene, config);
        break;
      default:
        createBasicScene(scene, config);
    }
  };

  const createBasicScene = (scene: Scene, config: any) => {
    const { shape = 'box' } = config.object || {};
    
    let mesh: Mesh;
    
    switch (shape) {
      case 'sphere':
        mesh = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
        break;
      case 'cylinder':
        mesh = MeshBuilder.CreateCylinder('cylinder', { height: 3, diameter: 1 }, scene);
        break;
      case 'plane':
        mesh = MeshBuilder.CreateGround('plane', { width: 4, height: 4 }, scene);
        break;
      case 'torus':
        mesh = MeshBuilder.CreateTorus('torus', { diameter: 2, thickness: 0.5 }, scene);
        break;
      default:
        mesh = MeshBuilder.CreateBox('box', { size: 2 }, scene);
    }

    const material = new StandardMaterial('material', scene);
    material.diffuseColor = Color3.FromHexString(config.object?.material?.color || '#3b82f6');
    mesh.material = material;
  };

  const createAdvanced3DScene = (scene: Scene, config: any) => {
    // Create multiple objects with different materials
    const box = MeshBuilder.CreateBox('box', { size: 1 }, scene);
    box.position.x = -2;
    const boxMaterial = new StandardMaterial('boxMaterial', scene);
    boxMaterial.diffuseColor = Color3.FromHexString('#ef4444');
    box.material = boxMaterial;

    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 1 }, scene);
    sphere.position.x = 0;
    const sphereMaterial = new StandardMaterial('sphereMaterial', scene);
    sphereMaterial.diffuseColor = Color3.FromHexString('#10b981');
    sphere.material = sphereMaterial;

    const cylinder = MeshBuilder.CreateCylinder('cylinder', { height: 1.5, diameter: 1 }, scene);
    cylinder.position.x = 2;
    const cylinderMaterial = new StandardMaterial('cylinderMaterial', scene);
    cylinderMaterial.diffuseColor = Color3.FromHexString('#f59e0b');
    cylinder.material = cylinderMaterial;

    // Add rotation animation
    scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
      sphere.rotation.x += 0.01;
      cylinder.rotation.z += 0.01;
    });
  };

  const createPhysicsScene = (scene: Scene, config: any) => {
    // Create ground
    const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    const groundMaterial = new StandardMaterial('groundMaterial', scene);
    groundMaterial.diffuseColor = Color3.FromHexString('#6b7280');
    ground.material = groundMaterial;

    // Create falling objects
    for (let i = 0; i < 5; i++) {
      const box = MeshBuilder.CreateBox(`box${i}`, { size: 0.5 }, scene);
      box.position.y = 5 + i;
      box.position.x = (Math.random() - 0.5) * 4;
      box.position.z = (Math.random() - 0.5) * 4;
      
      const material = new StandardMaterial(`material${i}`, scene);
      material.diffuseColor = Color3.FromHexString(['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][i]);
      box.material = material;
    }
  };

  const createMaterialsScene = (scene: Scene, config: any) => {
    const { metallic = false, roughness = 0.5 } = config.object?.material || {};
    
    const sphere = MeshBuilder.CreateSphere('sphere', { diameter: 2 }, scene);
    const material = new StandardMaterial('material', scene);
    material.diffuseColor = Color3.FromHexString(config.object?.material?.color || '#3b82f6');
    
    if (metallic) {
      material.specularColor = Color3.FromHexString('#ffffff');
      material.specularPower = 100;
    }
    
    sphere.material = material;
  };

  const createAnimationScene = (scene: Scene, config: any) => {
    const torus = MeshBuilder.CreateTorus('torus', { diameter: 2, thickness: 0.5 }, scene);
    const material = new StandardMaterial('material', scene);
    material.diffuseColor = Color3.FromHexString('#8b5cf6');
    torus.material = material;

    // Complex animation
    let time = 0;
    scene.registerBeforeRender(() => {
      time += 0.01;
      torus.rotation.x = Math.sin(time) * 0.5;
      torus.rotation.y = time;
      torus.rotation.z = Math.cos(time) * 0.3;
      torus.position.y = Math.sin(time * 2) * 0.5;
    });
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-700 capitalize">
        {type.replace('-', ' ')} Visualization
      </div>
      <canvas 
        ref={canvasRef} 
        className="rounded-lg border border-gray-200 bg-white"
        style={{ width, height }}
      />
    </div>
  );
}
