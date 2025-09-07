"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

type ThreeJSVisualizerProps = {
  type: 'geometry' | 'chemistry' | 'physics' | 'math';
  config?: {
    geometry?: {
      shape: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus';
      color?: string;
      wireframe?: boolean;
    };
    chemistry?: {
      molecule: 'water' | 'methane' | 'benzene' | 'dna';
    };
    physics?: {
      simulation: 'pendulum' | 'spring' | 'wave' | 'particle';
    };
    math?: {
      function: string;
      range: [number, number];
    };
  };
  width?: number;
  height?: number;
};

export default function ThreeJSVisualizer({ 
  type, 
  config = {}, 
  width = 400, 
  height = 300 
}: ThreeJSVisualizerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0xf8fafc);
    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Create content based on type
    let mesh: THREE.Object3D;
    
    switch (type) {
      case 'geometry':
        mesh = createGeometry(config.geometry);
        break;
      case 'chemistry':
        mesh = createMolecule(config.chemistry);
        break;
      case 'physics':
        mesh = createPhysicsSimulation(config.physics);
        break;
      case 'math':
        mesh = createMathFunction(config.math);
        break;
      default:
        mesh = createGeometry({ shape: 'cube' });
    }

    scene.add(mesh);
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Rotate the mesh
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [type, config, width, height]);

  const createGeometry = (geoConfig: any = {}) => {
    const { shape = 'cube', color = '#3b82f6', wireframe = false } = geoConfig;
    
    let geometry: THREE.BufferGeometry;
    
    switch (shape) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(1, 2, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
    }

    const material = new THREE.MeshLambertMaterial({ 
      color, 
      wireframe 
    });
    
    return new THREE.Mesh(geometry, material);
  };

  const createMolecule = (chemConfig: any = {}) => {
    const { molecule = 'water' } = chemConfig;
    const group = new THREE.Group();

    // Simple molecule representations
    switch (molecule) {
      case 'water':
        // H2O: O in center, 2 H atoms
        const oxygen = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshLambertMaterial({ color: '#ef4444' })
        );
        oxygen.position.set(0, 0, 0);
        
        const hydrogen1 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshLambertMaterial({ color: '#ffffff' })
        );
        hydrogen1.position.set(0.8, 0.6, 0);
        
        const hydrogen2 = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshLambertMaterial({ color: '#ffffff' })
        );
        hydrogen2.position.set(-0.8, 0.6, 0);
        
        group.add(oxygen, hydrogen1, hydrogen2);
        break;
        
      case 'methane':
        // CH4: C in center, 4 H atoms in tetrahedral arrangement
        const carbon = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 16, 16),
          new THREE.MeshLambertMaterial({ color: '#000000' })
        );
        carbon.position.set(0, 0, 0);
        
        const positions = [
          [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
        ];
        
        positions.forEach(pos => {
          const hydrogen = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshLambertMaterial({ color: '#ffffff' })
          );
          hydrogen.position.set(pos[0] * 0.6, pos[1] * 0.6, pos[2] * 0.6);
          group.add(hydrogen);
        });
        
        group.add(carbon);
        break;
        
      default:
        return createGeometry({ shape: 'sphere', color: '#10b981' });
    }

    return group;
  };

  const createPhysicsSimulation = (physicsConfig: any = {}) => {
    const { simulation = 'pendulum' } = physicsConfig;
    
    switch (simulation) {
      case 'pendulum':
        const pendulum = new THREE.Group();
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 2, 8),
          new THREE.MeshLambertMaterial({ color: '#8b5cf6' })
        );
        rod.position.y = -1;
        
        const bob = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshLambertMaterial({ color: '#f59e0b' })
        );
        bob.position.y = -2;
        
        pendulum.add(rod, bob);
        return pendulum;
        
      case 'spring':
        const spring = new THREE.Group();
        const springGeometry = new THREE.BufferGeometry();
        const points = [];
        for (let i = 0; i < 100; i++) {
          const t = i / 100;
          const x = Math.sin(t * Math.PI * 8) * 0.1;
          const y = t * 2 - 1;
          const z = 0;
          points.push(new THREE.Vector3(x, y, z));
        }
        springGeometry.setFromPoints(points);
        
        const springMaterial = new THREE.LineBasicMaterial({ color: '#06b6d4' });
        const springLine = new THREE.Line(springGeometry, springMaterial);
        spring.add(springLine);
        return spring;
        
      default:
        return createGeometry({ shape: 'sphere', color: '#8b5cf6' });
    }
  };

  const createMathFunction = (mathConfig: any = {}) => {
    const { function: func = 'sin(x)', range = [-5, 5] } = mathConfig;
    
    const geometry = new THREE.BufferGeometry();
    const points = [];
    
    for (let i = 0; i < 200; i++) {
      const x = range[0] + (range[1] - range[0]) * (i / 200);
      let y = 0;
      
      try {
        // Simple function evaluation (in a real app, use a proper math parser)
        if (func.includes('sin')) {
          y = Math.sin(x);
        } else if (func.includes('cos')) {
          y = Math.cos(x);
        } else if (func.includes('x^2') || func.includes('x*x')) {
          y = x * x;
        } else {
          y = Math.sin(x); // fallback
        }
      } catch (e) {
        y = 0;
      }
      
      points.push(new THREE.Vector3(x * 0.5, y * 0.5, 0));
    }
    
    geometry.setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: '#10b981' });
    
    return new THREE.Line(geometry, material);
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm text-gray-700 capitalize">
        {type} Visualization
      </div>
      <div 
        ref={mountRef} 
        className="rounded-lg border border-gray-200 bg-white"
        style={{ width, height }}
      />
    </div>
  );
}
