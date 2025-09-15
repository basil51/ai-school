'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
//import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
//import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuickFeedbackWidgetProps {
  feature: string;
  context?: {
    page?: string;
    lesson?: string;
    assessment?: string;
  };
  onClose?: () => void;
}

const quickFeedbackTypes = [
  { value: 'positive', label: 'Positive', icon: ThumbsUp, color: 'green' },
  { value: 'negative', label: 'Negative', icon: ThumbsDown, color: 'red' },
  { value: 'suggestion', label: 'Suggestion', icon: Send, color: 'blue' },
];

export function QuickFeedbackWidget({ feature, context, onClose }: QuickFeedbackWidgetProps) {
  const [feedback, setFeedback] = useState({
    type: '',
    rating: 0,
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          category: 'User Experience',
          rating: feedback.rating,
          title: `${feedback.type === 'positive' ? 'Positive' : feedback.type === 'negative' ? 'Negative' : 'Suggestion'} feedback for ${feature}`,
          description: feedback.comment || `Quick ${feedback.type} feedback for ${feature}`,
          context: {
            ...context,
            feature,
            feedbackType: 'quick',
            timestamp: new Date().toISOString(),
          },
          tags: [feature, feedback.type],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      toast.success('Thank you for your feedback!');
      setFeedback({ type: '', rating: 0, comment: '' });
      onClose?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = quickFeedbackTypes.find(type => type.value === feedback.type);
  const IconComponent = selectedType?.icon || ThumbsUp;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            Quick Feedback
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
              {quickFeedbackTypes.map((type) => {
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

          {/* Rating */}
          {feedback.type && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
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
  );
}
