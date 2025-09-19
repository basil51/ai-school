'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Send, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureFeedbackWidgetProps {
  feature: string;
  context?: {
    page?: string;
    lesson?: string;
    assessment?: string;
    component?: string;
  };
  onClose?: () => void;
  variant?: 'compact' | 'expanded';
}

const feedbackTypes = [
  { value: 'positive', label: 'Positive', icon: ThumbsUp, color: 'text-green-600' },
  { value: 'negative', label: 'Negative', icon: ThumbsDown, color: 'text-red-600' },
  { value: 'suggestion', label: 'Suggestion', icon: MessageSquare, color: 'text-blue-600' },
];

const categories = [
  'User Experience',
  'Functionality',
  'Performance',
  'Design',
  'Content',
  'Navigation',
  'Accessibility',
  'Other'
];

export function FeatureFeedbackWidget({ 
  feature, 
  context, 
  onClose, 
  variant = 'compact' 
}: FeatureFeedbackWidgetProps) {
  const [feedback, setFeedback] = useState({
    type: '',
    category: '',
    rating: 0,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === 'expanded');

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
          feedbackType: feedback.type === 'positive' ? 'general_feedback' : 
                       feedback.type === 'negative' ? 'usability_issue' : 'improvement_suggestion',
          category: feedback.category || 'User Experience',
          rating: feedback.rating,
          title: `${feedback.type === 'positive' ? 'Positive' : feedback.type === 'negative' ? 'Negative' : 'Suggestion'} feedback for ${feature}`,
          description: feedback.comment || `Quick ${feedback.type} feedback for ${feature}`,
          context: {
            ...context,
            feature,
            feedbackType: 'feature_specific',
            timestamp: new Date().toISOString(),
          },
          tags: [feature, feedback.type, feedback.category].filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      setFeedback({ type: '', category: '', rating: 0, comment: '' });
      setIsExpanded(false);
      onClose?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-emerald-600 hover:bg-emerald-700"
          size="icon"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Quick Feedback</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(false);
                onClose?.();
              }}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            How was your experience with <strong>{feature}</strong>?
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type of Feedback</label>
              <div className="flex gap-2">
                {feedbackTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant={feedback.type === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedback(prev => ({ ...prev, type: type.value }))}
                      className="flex-1"
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            {feedback.type && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={feedback.category}
                  onValueChange={(value) => setFeedback(prev => ({ ...prev, category: value }))}
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
            )}

            {/* Rating */}
            {feedback.type && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <div
                        className={`h-6 w-6 rounded-full border-2 ${
                          star <= feedback.rating
                            ? 'bg-yellow-400 border-yellow-400'
                            : 'border-gray-300 hover:border-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Comment */}
            {feedback.type && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Comments (Optional)</label>
                <Textarea
                  value={feedback.comment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Tell us more about your experience..."
                  rows={3}
                />
              </div>
            )}

            {/* Submit Button */}
            {feedback.type && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
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
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
