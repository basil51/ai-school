"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MultiMethodTeachingInterface from '@/components/MultiMethodTeachingInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Lightbulb, 
  BookMarked, 
  Zap, 
  Brain,
  GraduationCap,
  Target,
  TrendingUp
} from 'lucide-react';

const sampleLessons = [
  {
    id: 'math-algebra',
    subject: 'Mathematics',
    topic: 'Algebra',
    title: 'Solving Linear Equations',
    content: `Linear equations are equations where the highest power of the variable is 1. They can be written in the form ax + b = c, where a, b, and c are constants and x is the variable we want to solve for.

To solve a linear equation:
1. Isolate the variable term on one side of the equation
2. Perform the same operation on both sides to maintain equality
3. Simplify to find the value of the variable

For example, to solve 2x + 3 = 7:
- Subtract 3 from both sides: 2x = 4
- Divide both sides by 2: x = 2

This method works for all linear equations and is fundamental to algebra.`
  },
  {
    id: 'physics-gravity',
    subject: 'Physics',
    topic: 'Gravity',
    title: 'Newton\'s Law of Universal Gravitation',
    content: `Newton's Law of Universal Gravitation states that every particle in the universe attracts every other particle with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers.

The mathematical formula is: F = G(m₁m₂)/r²

Where:
- F is the gravitational force between the two objects
- G is the gravitational constant (6.674 × 10⁻¹¹ N⋅m²/kg²)
- m₁ and m₂ are the masses of the two objects
- r is the distance between the centers of the two objects

This law explains why objects fall to Earth, why planets orbit the Sun, and why the Moon orbits Earth. The force of gravity decreases as the distance between objects increases, following an inverse square relationship.`
  },
  {
    id: 'biology-photosynthesis',
    subject: 'Biology',
    topic: 'Photosynthesis',
    title: 'How Plants Make Food',
    content: `Photosynthesis is the process by which plants, algae, and some bacteria convert light energy into chemical energy. This process is essential for life on Earth as it produces oxygen and forms the base of most food chains.

The overall equation for photosynthesis is:
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂

This process occurs in two main stages:
1. Light-dependent reactions (in thylakoids): Light energy is captured and converted to chemical energy (ATP and NADPH)
2. Light-independent reactions (in stroma): CO₂ is fixed and converted to glucose using the energy from ATP and NADPH

The process takes place primarily in the chloroplasts of plant cells, specifically in the thylakoid membranes and stroma. Chlorophyll, the green pigment in plants, is essential for capturing light energy.`
  }
];

export default function MultiMethodTeachingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedLesson, setSelectedLesson] = useState(sampleLessons[0]);
  const [studentId, setStudentId] = useState('demo-student-1');
  const [customContent, setCustomContent] = useState('');
  const [useCustomContent, setUseCustomContent] = useState(false);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleMethodSelected = (method: string, success: boolean, timeSpent: number) => {
    console.log('Method selected:', { method, success, timeSpent });
    // You could show a success message or redirect here
  };

  const currentContent = useCustomContent ? customContent : selectedLesson.content;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Multi-Method Teaching Engine
            </h1>
            <p className="text-xl text-gray-600">
              Experience personalized learning with multiple explanation styles
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Phase 17 - Multi-Method Teaching
          </Badge>
        </div>
      </div>

      {/* Lesson Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
            Lesson Configuration
          </CardTitle>
          <CardDescription>
            Choose a lesson or enter custom content to test the multi-method teaching engine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student ID */}
          <div>
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
            />
          </div>

          {/* Content Source Selection */}
          <div>
            <Label>Content Source</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={!useCustomContent ? "default" : "outline"}
                onClick={() => setUseCustomContent(false)}
              >
                Sample Lesson
              </Button>
              <Button
                variant={useCustomContent ? "default" : "outline"}
                onClick={() => setUseCustomContent(true)}
              >
                Custom Content
              </Button>
            </div>
          </div>

          {/* Sample Lesson Selection */}
          {!useCustomContent && (
            <div>
              <Label htmlFor="lessonSelect">Select Sample Lesson</Label>
              <Select value={selectedLesson.id} onValueChange={(value) => {
                const lesson = sampleLessons.find(l => l.id === value);
                if (lesson) setSelectedLesson(lesson);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lesson" />
                </SelectTrigger>
                <SelectContent>
                  {sampleLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.subject} - {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Content Input */}
          {useCustomContent && (
            <div>
              <Label htmlFor="customContent">Custom Lesson Content</Label>
              <Textarea
                id="customContent"
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Enter your lesson content here..."
                rows={6}
              />
            </div>
          )}

          {/* Lesson Preview */}
          <div>
            <Label>Lesson Preview</Label>
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedLesson.subject} - {selectedLesson.topic}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  {currentContent.substring(0, 200)}...
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Teaching Methods Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-600" />
            Available Teaching Methods
          </CardTitle>
          <CardDescription>
            The AI will generate explanations using these different approaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Step-by-Step</h3>
              <p className="text-sm text-gray-600">Clear sequential breakdown</p>
            </div>
            <div className="text-center">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-semibold">Analogy</h3>
              <p className="text-sm text-gray-600">Familiar concepts</p>
            </div>
            <div className="text-center">
              <BookMarked className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Story-Based</h3>
              <p className="text-sm text-gray-600">Engaging narratives</p>
            </div>
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Simplified</h3>
              <p className="text-sm text-gray-600">Basic terms</p>
            </div>
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <h3 className="font-semibold">Advanced</h3>
              <p className="text-sm text-gray-600">Full complexity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Method Teaching Interface */}
      {currentContent && (
        <MultiMethodTeachingInterface
          lessonContent={currentContent}
          studentId={studentId}
          subject={selectedLesson.subject}
          topic={selectedLesson.topic}
          onMethodSelected={handleMethodSelected}
        />
      )}

      {/* Features Overview */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Phase 17 Features
          </CardTitle>
          <CardDescription>
            What makes the Multi-Method Teaching Engine special
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Diverse Explanations</h3>
              <p className="text-sm text-gray-600">
                AI generates 5 different teaching methods for each topic, ensuring every student finds an approach that works for them.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Student Choice</h3>
              <p className="text-sm text-gray-600">
                Learners can pick their preferred method or request another explanation, giving them control over their learning experience.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-sm text-gray-600">
                The system learns from student choices and performance to recommend the most effective methods for each individual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
