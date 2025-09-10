'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/lib/useTranslations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Star, Send, MessageSquare, Bug, Lightbulb, AlertTriangle, Eye, Zap, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  onClose?: () => void;
  context?: {
    page?: string;
    feature?: string;
    lesson?: string;
    assessment?: string;
  };
  defaultType?: 'bug_report' | 'feature_request' | 'improvement_suggestion' | 'general_feedback' | 'usability_issue' | 'accessibility_concern' | 'performance_issue' | 'content_feedback';
}

const feedbackTypes = [
  { value: 'bug_report', label: 'Bug Report', icon: Bug, color: 'destructive' },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'default' },
  { value: 'improvement_suggestion', label: 'Improvement Suggestion', icon: MessageSquare, color: 'secondary' },
  { value: 'general_feedback', label: 'General Feedback', icon: FileText, color: 'outline' },
  { value: 'usability_issue', label: 'Usability Issue', icon: Users, color: 'warning' },
  { value: 'accessibility_concern', label: 'Accessibility Concern', icon: Eye, color: 'info' },
  { value: 'performance_issue', label: 'Performance Issue', icon: Zap, color: 'error' },
  { value: 'content_feedback', label: 'Content Feedback', icon: FileText, color: 'success' },
];

const categories = [
  'User Interface',
  'Learning Experience',
  'Assessment System',
  'AI Teacher',
  'Navigation',
  'Performance',
  'Accessibility',
  'Content Quality',
  'Mobile Experience',
  'Other'
];

export function FeedbackForm({ onClose, context, defaultType }: FeedbackFormProps) {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    feedbackType: defaultType || 'general_feedback',
    category: '',
    rating: 0,
    title: '',
    description: '',
    isAnonymous: false,
    isPublic: false,
    tags: [] as string[],
  });

  const [customTag, setCustomTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully! Thank you for helping us improve.');
      setFormData({
        feedbackType: 'general_feedback',
        category: '',
        rating: 0,
        title: '',
        description: '',
        isAnonymous: false,
        isPublic: false,
        tags: [],
      });
      onClose?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const selectedType = feedbackTypes.find(type => type.value === formData.feedbackType);
  const IconComponent = selectedType?.icon || MessageSquare;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          {selectedType?.label || 'Feedback'}
        </CardTitle>
        <CardDescription>
          Help us improve the AI School platform by sharing your feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedbackType">Type of Feedback</Label>
            <Select
              value={formData.feedbackType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, feedbackType: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Overall Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating} out of 5
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of your feedback"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Please provide detailed information about your feedback..."
              rows={6}
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleTagRemove(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd(customTag);
                    setCustomTag('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleTagAdd(customTag);
                  setCustomTag('');
                }}
              >
                Add
              </Button>
            </div>
          </div>

          <Separator />

          {/* Privacy Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous">Submit Anonymously</Label>
                <p className="text-sm text-gray-600">
                  Your name will not be associated with this feedback
                </p>
              </div>
              <Switch
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public">Make Public</Label>
                <p className="text-sm text-gray-600">
                  Allow others to see this feedback (excluding personal information)
                </p>
              </div>
              <Switch
                id="public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>
          </div>

          {/* Context Information */}
          {context && (
            <div className="space-y-2">
              <Label>Context Information</Label>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                <p><strong>Page:</strong> {context.page || 'Unknown'}</p>
                {context.feature && <p><strong>Feature:</strong> {context.feature}</p>}
                {context.lesson && <p><strong>Lesson:</strong> {context.lesson}</p>}
                {context.assessment && <p><strong>Assessment:</strong> {context.assessment}</p>}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
