"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DemoDataGenerator, DemoStudent } from '@/lib/personalization/demo-data';
import { User, Brain, Target, TrendingUp, Clock } from 'lucide-react';

interface DemoStudentSelectorProps {
  onStudentSelect: (studentId: string) => void;
  selectedStudentId?: string;
}

export default function DemoStudentSelector({ onStudentSelect, selectedStudentId }: DemoStudentSelectorProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>(selectedStudentId || 'demo-student-1');
  const demoStudents = DemoDataGenerator.getAllDemoStudents();

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    onStudentSelect(studentId);
  };

  const getLearningStyleColor = (style: string) => {
    const colors = {
      visual: 'bg-blue-100 text-blue-800 border-blue-200',
      auditory: 'bg-green-100 text-green-800 border-green-200',
      kinesthetic: 'bg-purple-100 text-purple-800 border-purple-200',
      analytical: 'bg-orange-100 text-orange-800 border-orange-200',
      creative: 'bg-pink-100 text-pink-800 border-pink-200',
      collaborative: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[style as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Select Demo Student</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
          DEMO MODE
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoStudents.map((student) => (
          <Card 
            key={student.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedStudent === student.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => handleStudentSelect(student.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{student.name}</CardTitle>
                {selectedStudent === student.id && (
                  <Badge variant="default" className="bg-blue-600">
                    Selected
                  </Badge>
                )}
              </div>
              <CardDescription>
                {student.learningProfile.grade} • {student.learningProfile.age} years old
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Learning Style */}
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-gray-500" />
                <Badge variant="outline" className={getLearningStyleColor(student.learningProfile.learningStyle)}>
                  {student.learningProfile.learningStyle}
                </Badge>
              </div>
              
              {/* Subjects */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Subjects:</p>
                <div className="flex flex-wrap gap-1">
                  {student.learningProfile.subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Learning Metrics */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">Velocity:</span>
                  <span className="font-medium">
                    {Math.round(student.learningPattern.learningVelocity * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">Retention:</span>
                  <span className="font-medium">
                    {Math.round(student.learningPattern.retentionRate * 100)}%
                  </span>
                </div>
              </div>
              
              {/* Recent Activity */}
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-3 h-3" />
                <span>
                  {student.recentActivity.sessionsThisWeek} sessions this week
                </span>
              </div>
              
              {/* Strengths Preview */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">Strengths:</p>
                <div className="flex flex-wrap gap-1">
                  {student.learningProfile.strengths.slice(0, 2).map((strength, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {strength}
                    </Badge>
                  ))}
                  {student.learningProfile.strengths.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{student.learningProfile.strengths.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Demo Mode Active</h4>
            <p className="text-sm text-blue-700">
              You're viewing simulated learning data for demonstration purposes. 
              In a real environment, this data would be collected over time from actual student interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
