"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, BookOpen, Target, Users, Edit, CheckCircle, AlertCircle } from "lucide-react";


interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  duration: number; // in minutes
  objectives: string[];
  content: string;
  activities: string[];
  assessment: string;
  prerequisites: string[];
  status: 'draft' | 'approved' | 'ai_generated' | 'pending_review';
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
  aiGenerated?: boolean;
  aiSuggestions?: string[];
}

interface LessonPlanViewerProps {
  lessonPlan?: LessonPlan;
  onEdit?: (lessonPlan: LessonPlan) => void;
  onApprove?: (lessonPlanId: string) => void;
  onReject?: (lessonPlanId: string) => void;
  className?: string;
}

export function LessonPlanViewer({
  lessonPlan,
  onEdit,
  onApprove,
  onReject,
  className = ""
}: LessonPlanViewerProps) {

  const [activeTab, setActiveTab] = useState("overview");

  if (!lessonPlan) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lesson plan selected</p>
            <p className="text-sm mt-2">
              Select a lesson plan to view its details
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'ai_generated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><BookOpen className="h-3 w-3 mr-1" />AI Generated</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{lessonPlan.title}</CardTitle>
            <CardDescription className="mt-2">
              {lessonPlan.subject} • {lessonPlan.gradeLevel} • {lessonPlan.duration} minutes
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(lessonPlan.status)}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(lessonPlan)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {lessonPlan.createdBy.name} ({lessonPlan.createdBy.role})
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(lessonPlan.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lessonPlan.duration} minutes
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Learning Objectives
                </h3>
                <ul className="space-y-2">
                  {lessonPlan.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {lessonPlan.prerequisites.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Prerequisites</h3>
                  <div className="flex flex-wrap gap-2">
                    {lessonPlan.prerequisites.map((prereq, index) => (
                      <Badge key={index} variant="outline">{prereq}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {lessonPlan.aiSuggestions && lessonPlan.aiSuggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-blue-600">AI Suggestions</h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <ul className="space-y-2">
                      {lessonPlan.aiSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <ScrollArea className="h-[400px]">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{lessonPlan.content}</div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <div className="space-y-4">
              {lessonPlan.activities.map((activity, index) => (
                <div key={index} className="p-4 border rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="font-medium">Activity {index + 1}</span>
                    </div>
                  <p className="text-sm">{activity}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="mt-6">
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2">Assessment Method</h3>
              <p className="text-sm">{lessonPlan.assessment}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Approval Actions */}
        {lessonPlan.status === 'pending_review' && (onApprove || onReject) && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Review Actions</h3>
              <div className="flex gap-2">
                {onReject && (
                  <Button
                    variant="outline"
                    onClick={() => onReject(lessonPlan.id)}
                  >
                    Reject
                  </Button>
                )}
                {onApprove && (
                  <Button
                    onClick={() => onApprove(lessonPlan.id)}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
