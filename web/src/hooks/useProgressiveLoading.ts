import { useState, useEffect, useCallback } from 'react';
import { progressiveLoader } from '@/lib/performance/progressive-loading';

export interface UseProgressiveLoadingReturn {
  sessionId: string | null;
  progress: number;
  status: 'pending' | 'loading' | 'completed' | 'failed' | 'paused';
  error: string | null;
  startLoading: () => void;
  pauseLoading: () => void;
  resumeLoading: () => void;
  cancelLoading: () => void;
  isComplete: boolean;
  isError: boolean;
  isPaused: boolean;
}

export function useProgressiveLoading(
  lessonId: string, 
  content: any
): UseProgressiveLoadingReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'loading' | 'completed' | 'failed' | 'paused'>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeLoading = async () => {
      try {
        const id = await progressiveLoader.initializeSession(lessonId, content);
        if (mounted) {
          setSessionId(id);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize loading');
        }
      }
    };

    initializeLoading();

    return () => {
      mounted = false;
    };
  }, [lessonId, content]);

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      const session = progressiveLoader.getSessionStatus(sessionId);
      if (session) {
        setProgress(session.progress);
        setStatus(session.status);
        
        if (session.status === 'failed') {
          setError('Loading session failed');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [sessionId]);

  const startLoading = useCallback(() => {
    if (sessionId) {
      progressiveLoader.startLoading(sessionId);
    }
  }, [sessionId]);

  const pauseLoading = useCallback(() => {
    if (sessionId) {
      progressiveLoader.pauseSession(sessionId);
    }
  }, [sessionId]);

  const resumeLoading = useCallback(() => {
    if (sessionId) {
      progressiveLoader.resumeSession(sessionId);
    }
  }, [sessionId]);

  const cancelLoading = useCallback(() => {
    if (sessionId) {
      progressiveLoader.cancelSession(sessionId);
    }
  }, [sessionId]);

  return {
    sessionId,
    progress,
    status,
    error,
    startLoading,
    pauseLoading,
    resumeLoading,
    cancelLoading,
    isComplete: status === 'completed',
    isError: status === 'failed' || !!error,
    isPaused: status === 'paused',
  };
}
