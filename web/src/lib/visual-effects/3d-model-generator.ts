import * as THREE from 'three';

export interface Model3D {
  id: string;
  type: 'geometry' | 'molecule' | 'anatomy' | 'architecture' | 'physics';
  modelData: string; // 3D model file or JSON data
  materials: Material[];
  animations: Animation[];
  interactions: Interaction[];
  metadata: {
    title: string;
    description: string;
    subject: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
  };
}

export interface Material {
  id: string;
  name: string;
  type: 'standard' | 'phong' | 'lambert' | 'pbr';
  color: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  map?: string; // texture URL
  normalMap?: string;
  bumpMap?: string;
}

export interface Animation {
  id: string;
  name: string;
  type: 'rotation' | 'translation' | 'scale' | 'morph' | 'custom';
  duration: number;
  loop: boolean;
  keyframes: Keyframe[];
}

export interface Keyframe {
  time: number;
  value: any;
  easing?: string;
}

export interface Interaction {
  id: string;
  type: 'click' | 'hover' | 'drag' | 'zoom' | 'rotate';
  target: string; // object ID
  action: string; // action description
  feedback?: string; // user feedback
}

export class Model3DGenerator {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private controls: any; // OrbitControls will be added later

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
    
    this.setupRenderer();
    this.setupLighting();
    this.setupCamera();
  }

  private setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  private setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(-10, 10, -10);
    this.scene.add(pointLight);
  }

  private setupCamera() {
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);
  }

  // Generate 3D geometry models
  generateGeometryModel(type: string, parameters: any): THREE.Object3D {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(parameters.width || 1, parameters.height || 1, parameters.depth || 1);
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x00ff00,
          metalness: parameters.metalness || 0.1,
          roughness: parameters.roughness || 0.8
        });
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(parameters.radius || 1, parameters.segments || 32, parameters.segments || 16);
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0xff0000,
          metalness: parameters.metalness || 0.1,
          roughness: parameters.roughness || 0.8
        });
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          parameters.radiusTop || 1,
          parameters.radiusBottom || 1,
          parameters.height || 2,
          parameters.segments || 32
        );
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x0000ff,
          metalness: parameters.metalness || 0.1,
          roughness: parameters.roughness || 0.8
        });
        break;

      case 'cone':
        geometry = new THREE.ConeGeometry(parameters.radius || 1, parameters.height || 2, parameters.segments || 32);
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0xffff00,
          metalness: parameters.metalness || 0.1,
          roughness: parameters.roughness || 0.8
        });
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(parameters.radius || 1, parameters.tube || 0.4, parameters.radialSegments || 16, parameters.tubularSegments || 100);
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0xff00ff,
          metalness: parameters.metalness || 0.1,
          roughness: parameters.roughness || 0.8
        });
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(parameters.width || 1, parameters.height || 1);
        material = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x888888,
          side: THREE.DoubleSide
        });
        break;

      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  // Generate molecular models
  generateMoleculeModel(moleculeData: any): THREE.Object3D {
    const group = new THREE.Group();
    
    // Add atoms
    moleculeData.atoms?.forEach((atom: any) => {
      const geometry = new THREE.SphereGeometry(atom.radius || 0.5, 32, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: atom.color || 0xffffff,
        metalness: 0.1,
        roughness: 0.8
      });
      
      const atomMesh = new THREE.Mesh(geometry, material);
      atomMesh.position.set(atom.x || 0, atom.y || 0, atom.z || 0);
      atomMesh.castShadow = true;
      atomMesh.receiveShadow = true;
      
      group.add(atomMesh);
    });

    // Add bonds
    moleculeData.bonds?.forEach((bond: any) => {
      const start = new THREE.Vector3(bond.start.x, bond.start.y, bond.start.z);
      const end = new THREE.Vector3(bond.end.x, bond.end.y, bond.end.z);
      
      const geometry = new THREE.CylinderGeometry(0.1, 0.1, start.distanceTo(end), 8);
      const material = new THREE.MeshStandardMaterial({ 
        color: bond.color || 0xcccccc,
        metalness: 0.1,
        roughness: 0.8
      });
      
      const bondMesh = new THREE.Mesh(geometry, material);
      bondMesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
      bondMesh.lookAt(end);
      bondMesh.rotateX(Math.PI / 2);
      
      group.add(bondMesh);
    });

    return group;
  }

  // Generate physics simulation models
  generatePhysicsModel(type: string, parameters: any): THREE.Object3D {
    const group = new THREE.Group();
    
    switch (type) {
      case 'pendulum':
        // Pendulum bob
        const bobGeometry = new THREE.SphereGeometry(parameters.bobRadius || 0.2, 32, 16);
        const bobMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.bobColor || 0xff0000,
          metalness: 0.1,
          roughness: 0.8
        });
        const bob = new THREE.Mesh(bobGeometry, bobMaterial);
        bob.position.set(0, -parameters.length || 2, 0);
        bob.castShadow = true;
        bob.receiveShadow = true;
        
        // Pendulum string
        const stringGeometry = new THREE.CylinderGeometry(0.01, 0.01, parameters.length || 2, 8);
        const stringMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.stringColor || 0x333333,
          metalness: 0.1,
          roughness: 0.8
        });
        const string = new THREE.Mesh(stringGeometry, stringMaterial);
        string.position.set(0, -(parameters.length || 2) / 2, 0);
        
        group.add(string);
        group.add(bob);
        break;

      case 'spring':
        // Spring geometry
        const springGeometry = new THREE.CylinderGeometry(
          parameters.radius || 0.5,
          parameters.radius || 0.5,
          parameters.height || 3,
          32,
          1,
          true
        );
        const springMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x00ff00,
          metalness: 0.1,
          roughness: 0.8,
          wireframe: parameters.wireframe || false
        });
        const spring = new THREE.Mesh(springGeometry, springMaterial);
        spring.castShadow = true;
        spring.receiveShadow = true;
        
        group.add(spring);
        break;

      case 'wave':
        // Wave surface
        const waveGeometry = new THREE.PlaneGeometry(10, 10, 100, 100);
        const waveMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x0066ff,
          metalness: 0.1,
          roughness: 0.8,
          transparent: true,
          opacity: 0.8
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.rotation.x = -Math.PI / 2;
        wave.receiveShadow = true;
        
        group.add(wave);
        break;
    }

    return group;
  }

  // Generate architectural models
  generateArchitectureModel(type: string, parameters: any): THREE.Object3D {
    const group = new THREE.Group();
    
    switch (type) {
      case 'building':
        // Main structure
        const buildingGeometry = new THREE.BoxGeometry(
          parameters.width || 4,
          parameters.height || 8,
          parameters.depth || 4
        );
        const buildingMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0xcccccc,
          metalness: 0.1,
          roughness: 0.8
        });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = (parameters.height || 8) / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        
        // Windows
        for (let i = 0; i < (parameters.floors || 3); i++) {
          for (let j = 0; j < (parameters.windowsPerFloor || 4); j++) {
            const windowGeometry = new THREE.PlaneGeometry(0.8, 1.2);
            const windowMaterial = new THREE.MeshStandardMaterial({ 
              color: 0x87ceeb,
              transparent: true,
              opacity: 0.7
            });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(
              -parameters.width / 2 + (j + 1) * (parameters.width / (parameters.windowsPerFloor + 1)),
              i * 2.5 + 1,
              parameters.depth / 2 + 0.01
            );
            group.add(window);
          }
        }
        
        group.add(building);
        break;

      case 'bridge':
        // Bridge deck
        const deckGeometry = new THREE.BoxGeometry(parameters.length || 10, 0.5, parameters.width || 3);
        const deckMaterial = new THREE.MeshStandardMaterial({ 
          color: parameters.color || 0x8b4513,
          metalness: 0.1,
          roughness: 0.8
        });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = parameters.height || 2;
        deck.castShadow = true;
        deck.receiveShadow = true;
        
        // Support pillars
        for (let i = 0; i < (parameters.pillars || 3); i++) {
          const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.5, parameters.height || 2, 16);
          const pillarMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x696969,
            metalness: 0.1,
            roughness: 0.8
          });
          const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
          pillar.position.set(
            -parameters.length / 2 + (i + 1) * (parameters.length / (parameters.pillars + 1)),
            (parameters.height || 2) / 2,
            0
          );
          pillar.castShadow = true;
          pillar.receiveShadow = true;
          group.add(pillar);
        }
        
        group.add(deck);
        break;
    }

    return group;
  }

  // Add visual effects
  addVisualEffects(object: THREE.Object3D, effects: string[]): void {
    effects.forEach(effect => {
      switch (effect) {
        case 'glow':
          this.addGlowEffect(object);
          break;
        case 'particles':
          this.addParticleEffect(object);
          break;
        case 'outline':
          this.addOutlineEffect(object);
          break;
        case 'pulse':
          this.addPulseEffect(object);
          break;
      }
    });
  }

  private addGlowEffect(object: THREE.Object3D): void {
    const glowGeometry = object.clone();
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    
    if (glowGeometry instanceof THREE.Mesh) {
      glowGeometry.material = glowMaterial;
      glowGeometry.scale.multiplyScalar(1.1);
      object.add(glowGeometry);
    }
  }

  private addParticleEffect(object: THREE.Object3D): void {
    const particleCount = 100;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.02,
      transparent: true,
      opacity: 0.6
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    object.add(particleSystem);
  }

  private addOutlineEffect(object: THREE.Object3D): void {
    const outlineGeometry = object.clone();
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide
    });
    
    if (outlineGeometry instanceof THREE.Mesh) {
      outlineGeometry.material = outlineMaterial;
      outlineGeometry.scale.multiplyScalar(1.05);
      object.add(outlineGeometry);
    }
  }

  private addPulseEffect(object: THREE.Object3D): void {
    const originalScale = object.scale.clone();
    let time = 0;
    
    const animate = () => {
      time += 0.02;
      const scale = 1 + Math.sin(time) * 0.1;
      object.scale.copy(originalScale).multiplyScalar(scale);
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Render the scene
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  // Add object to scene
  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  // Remove object from scene
  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  // Get scene for external manipulation
  getScene(): THREE.Scene {
    return this.scene;
  }

  // Get camera for external manipulation
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  // Get renderer for external manipulation
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  // Dispose of resources
  dispose(): void {
    this.renderer.dispose();
    this.scene.clear();
  }
}
