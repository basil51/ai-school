"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
import { toast } from "sonner";

interface Assignment {
  id?: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  dueDate: string;
  estimatedTime: number; // in minutes
  instructions: string;
  rubric?: string;
  attachments?: string[];
  status: 'draft' | 'published' | 'ai_generated' | 'pending_review';
  aiGenerated?: boolean;
  aiSuggestions?: string[];
  assignedTo?: string[]; // student IDs
}

interface AssignmentCreatorProps {
  assignment?: Assignment;
  onSave: (assignment: Assignment) => void;
  onCancel?: () => void;
  className?: string;
}

export function AssignmentCreator({
  assignment,
  onSave,
  onCancel,
  className = ""
}: AssignmentCreatorProps) {
  const dict = useTranslations();
  const [formData, setFormData] = useState<Assignment>(
    assignment || {
      title: "",
      description: "",
      subject: "",
      gradeLevel: "",
      dueDate: "",
      estimatedTime: 60,
      instructions: "",
      rubric: "",
      status: 'draft',
      aiGenerated: false,
      aiSuggestions: [],
      assignedTo: []
    }
  );

  const [isLoading, setIsLoading] = useState(false);

  const subjects = [
    "Mathematics", "Science", "English", "History", "Geography", 
    "Art", "Music", "Physical Education", "Computer Science", "Literature"
  ];

  const gradeLevels = [
    "Kindergarten", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5",
    "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"
  ];

  const handleInputChange = (field: keyof Assignment, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateAiSuggestions = async () => {
    setIsLoading(true);
    try {
      // Simulate AI suggestion generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const suggestions = [
        "Consider adding visual aids or diagrams to support understanding",
        "Include real-world examples to make the content more relatable",
        "Add a peer review component to encourage collaboration",
        "Consider breaking this into smaller, more manageable tasks",
        "Include self-assessment questions to help students reflect on their learning"
      ];
      
      setFormData(prev => ({
        ...prev,
        aiSuggestions: suggestions,
        aiGenerated: true
      }));
      

      toast.success("AI suggestions generated successfully");
    } catch (_error) {
      toast.error("Error generating AI suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const applyAiSuggestion = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions + "\n\n" + suggestion
    }));
    toast.success("Suggestion applied to instructions");
  };

  const handleSave = () => {
    if (!formData.title || !formData.subject || !formData.gradeLevel) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onSave(formData);
    toast.success("Assignment saved successfully");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {assignment ? "Edit Assignment" : "Create Assignment"}
            </CardTitle>
            <CardDescription>
              Create a new assignment with AI assistance
            </CardDescription>
          </div>
          <Button
            onClick={generateAiSuggestions}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isLoading ? "Generating..." : "Get AI Suggestions"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gradeLevel">Grade Level *</Label>
              <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of the assignment"
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions *</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange('instructions', e.target.value)}
              placeholder="Detailed instructions for students"
              rows={6}
            />
          </div>

          {/* Rubric */}
          <div>
            <Label htmlFor="rubric">Rubric (Optional)</Label>
            <Textarea
              id="rubric"
              value={formData.rubric || ""}
              onChange={(e) => handleInputChange('rubric', e.target.value)}
              placeholder="Assessment criteria and grading rubric"
              rows={4}
            />
          </div>

          {/* AI Suggestions */}
          {formData.aiSuggestions && formData.aiSuggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-blue-600">
                  AI Suggestions
                </h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  AI Generated
                </Badge>
              </div>
              
              <div className="space-y-2">
                {formData.aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm">{suggestion}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applyAiSuggestion(suggestion)}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave}>
              Save Assignment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
