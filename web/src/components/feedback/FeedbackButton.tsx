'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FeedbackButtonProps {
  context?: {
    page?: string;
    feature?: string;
    lesson?: string;
    assessment?: string;
  };
  variant?: 'floating' | 'inline';
  className?: string;
}

export function FeedbackButton({ context, variant = 'floating', className }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'inline') {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className={className}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Give Feedback
        </Button>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Share Your Feedback</DialogTitle>
            </DialogHeader>
            <FeedbackForm
              onClose={() => setIsOpen(false)}
              context={context}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* Floating Feedback Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      {/* Feedback Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
          </DialogHeader>
          <FeedbackForm
            onClose={() => setIsOpen(false)}
            context={context}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
