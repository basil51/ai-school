"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SmartLearningCanvas from '@/components/SmartLearningCanvas';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users,
  BookOpen,
  Lightbulb,
  BarChart3,
  Settings,
  Plus,
  Eye,
  Edit
} from 'lucide-react';

type ContentType = 'text' | 'math' | 'diagram' | 'simulation' | 'video' | 'interactive' | '3d' | 'advanced-3d' | 'd3-advanced';

export default function TeacherSmartPage() {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('text');
  const [activeTab, setActiveTab] = useState('create');

  const content = useMemo(() => {
    switch (selectedContentType) {
      case 'text':
        return {
          type: 'text' as const,
          title: 'Introduction to Photosynthesis',
          content: `Photosynthesis is the process by which plants convert light energy into chemical energy. This fundamental biological process occurs in the chloroplasts of plant cells and is essential for life on Earth.

Key Components:
• Chlorophyll: The green pigment that captures light energy
• Carbon Dioxide: Absorbed from the atmosphere
• Water: Absorbed from the soil through roots
• Light Energy: Usually from sunlight

The process can be summarized by the equation:
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

This process not only produces glucose for the plant but also releases oxygen into the atmosphere, making it crucial for all aerobic life forms.`
        };
      case 'math':
        return {
          type: 'math' as const,
          title: 'Quadratic Equations',
          content: `Solve the quadratic equation: x² - 5x + 6 = 0

Using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a

Where:
• a = 1
• b = -5  
• c = 6

Substituting: x = (5 ± √(25 - 24)) / 2
x = (5 ± √1) / 2
x = (5 ± 1) / 2

Therefore:
• x₁ = (5 + 1) / 2 = 3
• x₂ = (5 - 1) / 2 = 2

The solutions are x = 2 and x = 3.`
        };
      case 'diagram':
        return {
          type: 'diagram' as const,
          title: 'Water Cycle Diagram',
          content: `graph TD
    A[Ocean] -->|Evaporation| B[Water Vapor]
    B -->|Condensation| C[Clouds]
    C -->|Precipitation| D[Rain/Snow]
    D -->|Collection| E[Rivers/Lakes]
    E -->|Runoff| A
    D -->|Infiltration| F[Groundwater]
    F -->|Springs| E
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#e1f5fe
    style F fill:#f1f8e9`
        };
      case 'simulation':
        return {
          type: 'simulation' as const,
          title: 'Projectile Motion Simulation',
          content: `Simulate the motion of a projectile launched at different angles and velocities.

Parameters:
• Initial Velocity: 20 m/s
• Launch Angle: 45°
• Gravity: 9.8 m/s²
• Air Resistance: Negligible

The projectile will follow a parabolic trajectory. You can adjust the launch angle and velocity to see how it affects the range and maximum height.`
        };
      case 'video':
        return {
          type: 'video' as const,
          title: 'Introduction to Quantum Mechanics',
          content: `A comprehensive introduction to the fundamental principles of quantum mechanics, covering wave-particle duality, uncertainty principle, and quantum superposition.

Video Duration: 15 minutes
Topics Covered:
• Wave-Particle Duality
• Heisenberg Uncertainty Principle
• Quantum Superposition
• Quantum Entanglement
• Applications in Modern Technology`
        };
      case 'interactive':
        return {
          type: 'interactive' as const,
          title: 'Interactive Periodic Table',
          content: `Explore the periodic table interactively. Click on elements to learn about their properties, electron configuration, and common uses.

Features:
• Element properties and characteristics
• Electron configuration visualization
• Atomic radius and electronegativity trends
• Common compounds and reactions
• Historical discovery information`
        };
      case '3d':
        return {
          type: '3d' as const,
          title: '3D Molecular Structure',
          content: `Visualize the 3D structure of a water molecule (H₂O) and understand its bent geometry.

Molecule: H₂O
• Central atom: Oxygen
• Bonded atoms: 2 Hydrogen atoms
• Bond angle: 104.5°
• Molecular geometry: Bent
• Polarity: Polar molecule

The 3D visualization shows the tetrahedral electron geometry and bent molecular geometry due to lone pairs on oxygen.`
        };
      case 'advanced-3d':
        return {
          type: 'advanced-3d' as const,
          title: 'Advanced 3D Physics Simulation',
          content: `Advanced 3D simulation of electromagnetic fields and particle interactions.

Features:
• Real-time electromagnetic field visualization
• Particle physics interactions
• Advanced material properties
• Physics engine with realistic constraints
• Interactive parameter adjustment`
        };
      case 'd3-advanced':
        return {
          type: 'd3-advanced' as const,
          title: 'Advanced Data Visualization',
          content: `Complex network analysis showing relationships between scientific concepts and their interconnections.

Visualization Type: Force-directed graph
• Nodes represent scientific concepts
• Edges show relationships and dependencies
• Interactive exploration of knowledge networks
• Dynamic filtering and search capabilities`
        };
      default:
        return {
          type: 'text' as const,
          title: 'Default Content',
          content: 'Select a content type to see the Smart Learning Canvas in action.'
        };
    }
  }, [selectedContentType]);

  const contentTypes: { type: ContentType; label: string; icon: React.ReactNode; description: string }[] = [
    { type: 'text', label: 'Text', icon: <BookOpen className="w-4 h-4" />, description: 'Rich text content with formatting' },
    { type: 'math', label: 'Math', icon: <Target className="w-4 h-4" />, description: 'Mathematical equations and formulas' },
    { type: 'diagram', label: 'Diagram', icon: <BarChart3 className="w-4 h-4" />, description: 'Mermaid diagrams and flowcharts' },
    { type: 'simulation', label: 'Simulation', icon: <Brain className="w-4 h-4" />, description: 'Interactive physics simulations' },
    { type: 'video', label: 'Video', icon: <Eye className="w-4 h-4" />, description: 'Educational video content' },
    { type: 'interactive', label: 'Interactive', icon: <Lightbulb className="w-4 h-4" />, description: 'Interactive learning experiences' },
    { type: '3d', label: '3D', icon: <TrendingUp className="w-4 h-4" />, description: 'Three-dimensional visualizations' },
    { type: 'advanced-3d', label: 'Advanced 3D', icon: <Settings className="w-4 h-4" />, description: 'Advanced 3D physics simulations' },
    { type: 'd3-advanced', label: 'D3 Advanced', icon: <BarChart3 className="w-4 h-4" />, description: 'Advanced data visualizations' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Smart Learning Canvas - Teacher Tools
            </h1>
            <p className="text-xl text-gray-600">
              Create and manage multimodal learning experiences for your students
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Phase 15 - Multi-Modal Teaching
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Content</TabsTrigger>
          <TabsTrigger value="manage">Manage Lessons</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {/* Content Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-500" />
                Create New Content
              </CardTitle>
              <CardDescription>Select a content type to create engaging learning experiences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((contentType) => (
                  <Button
                    key={contentType.type}
                    variant={selectedContentType === contentType.type ? "default" : "outline"}
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => setSelectedContentType(contentType.type)}
                  >
                    {contentType.icon}
                    <span className="font-medium">{contentType.label}</span>
                    <span className="text-xs text-center opacity-75">{contentType.description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Smart Learning Canvas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="w-5 h-5 mr-2 text-green-500" />
                Content Preview
              </CardTitle>
              <CardDescription>Preview how your content will appear to students</CardDescription>
            </CardHeader>
            <CardContent>
              <SmartLearningCanvas content={content} contentType={selectedContentType} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-500" />
                Lesson Management
              </CardTitle>
              <CardDescription>Manage your multimodal lessons and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Lesson management features coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                Usage Analytics
              </CardTitle>
              <CardDescription>Track how students interact with your multimodal content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Feature Overview */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Teacher Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-500" />
                Content Creation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create engaging multimodal content using text, math, diagrams, simulations, 
                videos, and interactive elements to enhance student learning.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Student Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor how students interact with different content types and optimize 
                your teaching materials based on engagement analytics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
                Learning Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track learning outcomes and effectiveness of different content modalities 
                to continuously improve your teaching approach.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
