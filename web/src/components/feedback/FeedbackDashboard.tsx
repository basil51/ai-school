'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
//import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  AlertTriangle, 
  Eye, 
  Zap, 
  FileText, 
  Users,
  Filter,
  Search,
  Reply,
  CheckCircle,
  Clock,
  Star,
  Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface Feedback {
  id: string;
  feedbackType: string;
  category: string;
  rating?: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  isAnonymous: boolean;
  isPublic: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedToUser?: {
    id: string;
    name: string;
    email: string;
  };
  response?: string;
  respondedAt?: string;
  tags: Array<{ tag: string }>;
}

const feedbackTypeIcons = {
  bug_report: Bug,
  feature_request: Lightbulb,
  improvement_suggestion: MessageSquare,
  general_feedback: FileText,
  usability_issue: Users,
  accessibility_concern: Eye,
  performance_issue: Zap,
  content_feedback: FileText,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_review: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  duplicate: 'bg-orange-100 text-orange-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function FeedbackDashboard() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    feedbackType: 'all',
    search: '',
  });
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [response, setResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
        if (filters.feedbackType && filters.feedbackType !== 'all') params.append('feedbackType', filters.feedbackType);
  
        const response = await fetch(`/api/feedback?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch feedback');
        
        const data = await response.json();
        setFeedback(data.feedback || []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        toast.error('Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedback();
  }, [filters]);



  const handleStatusUpdate = async (feedbackId: string, status: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, status } : f
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePriorityUpdate = async (feedbackId: string, priority: string) => {
    try {
      const response = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, priority }),
      });

      if (!response.ok) throw new Error('Failed to update priority');

      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { ...f, priority } : f
      ));
      toast.success('Priority updated successfully');
    } catch (error) {
      console.error('Error updating priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const handleResponse = async (feedbackId: string) => {
    if (!response.trim()) return;

    setIsResponding(true);
    try {
      const responseData = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, response: response.trim() }),
      });

      if (!responseData.ok) throw new Error('Failed to send response');

      setFeedback(prev => prev.map(f => 
        f.id === feedbackId ? { 
          ...f, 
          response: response.trim(),
          respondedAt: new Date().toISOString(),
          status: 'resolved'
        } : f
      ));
      setResponse('');
      setSelectedFeedback(null);
      toast.success('Response sent successfully');
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const filteredFeedback = feedback.filter(f => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        f.category.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const feedbackStats = {
    total: feedback.length,
    pending: feedback.filter(f => f.status === 'pending').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    critical: feedback.filter(f => f.priority === 'critical').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{feedbackStats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{feedbackStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{feedbackStats.inProgress}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{feedbackStats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-red-600">{feedbackStats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search feedback..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={filters.feedbackType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, feedbackType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="improvement_suggestion">Improvement Suggestion</SelectItem>
                  <SelectItem value="general_feedback">General Feedback</SelectItem>
                  <SelectItem value="usability_issue">Usability Issue</SelectItem>
                  <SelectItem value="accessibility_concern">Accessibility Concern</SelectItem>
                  <SelectItem value="performance_issue">Performance Issue</SelectItem>
                  <SelectItem value="content_feedback">Content Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback ({filteredFeedback.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFeedback.map((item) => {
              const IconComponent = feedbackTypeIcons[item.feedbackType as keyof typeof feedbackTypeIcons] || MessageSquare;
              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedFeedback(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-4 w-4" />
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={priorityColors[item.priority as keyof typeof priorityColors]}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Category: {item.category}</span>
                        {item.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {item.rating}/5
                          </div>
                        )}
                        <span>By: {item.isAnonymous ? 'Anonymous' : item.user?.name || 'Unknown'}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag.tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={item.status}
                          onValueChange={(value) => handleStatusUpdate(item.id, value)}
                        >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_review">In Review</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                        </Select>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={item.priority}
                          onValueChange={(value) => handlePriorityUpdate(item.id, value)}
                        >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Respond to Feedback</CardTitle>
              <CardDescription>{selectedFeedback.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{selectedFeedback.description}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Response</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleResponse(selectedFeedback.id)}
                  disabled={isResponding || !response.trim()}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFeedback(null);
                    setResponse('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
