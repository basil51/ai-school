'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Brain, 
  Zap, 
  Timer,
  Coffee,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface PacingSession {
  id: string;
  type: 'focus' | 'break' | 'long_break';
  duration: number; // in minutes
  remaining: number; // in seconds
  isActive: boolean;
  completed: boolean;
}

interface ADHDPreferences {
  focusDuration: number; // 15-45 minutes
  shortBreakDuration: number; // 3-10 minutes
  longBreakDuration: number; // 15-30 minutes
  longBreakInterval: number; // every 3-4 focus sessions
  enableNotifications: boolean;
  enableBackgroundSounds: boolean;
  enableProgressTracking: boolean;
}

export function ADHDFriendlyPacing() {
  const [preferences, setPreferences] = useState<ADHDPreferences>({
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    enableNotifications: true,
    enableBackgroundSounds: false,
    enableProgressTracking: true,
  });

  const [currentSession, setCurrentSession] = useState<PacingSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<PacingSession[]>([]);
  const [focusSessionsCompleted, setFocusSessionsCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const startSession = (type: 'focus' | 'break' | 'long_break') => {
    let duration = 0;
    
    switch (type) {
      case 'focus':
        duration = preferences.focusDuration * 60;
        break;
      case 'break':
        duration = preferences.shortBreakDuration * 60;
        break;
      case 'long_break':
        duration = preferences.longBreakDuration * 60;
        break;
    }

    const session: PacingSession = {
      id: Date.now().toString(),
      type,
      duration,
      remaining: duration,
      isActive: true,
      completed: false,
    };

    setCurrentSession(session);
    setTimeRemaining(duration);
    setIsRunning(true);

    if (preferences.enableNotifications) {
      toast.success(`${type === 'focus' ? 'Focus' : 'Break'} session started!`);
    }
  };

  const handleSessionComplete = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      isActive: false,
      completed: true,
      remaining: 0,
    };

    setSessionHistory(prev => [completedSession, ...prev]);
    
    if (currentSession.type === 'focus') {
      setFocusSessionsCompleted(prev => prev + 1);
    }

    setIsRunning(false);
    setCurrentSession(null);
    setTimeRemaining(0);

    if (preferences.enableNotifications) {
      toast.success('Session completed! Great job! 🎉');
    }

    // Auto-start break after focus session
    if (currentSession.type === 'focus') {
      setTimeout(() => {
        const shouldTakeLongBreak = focusSessionsCompleted > 0 && 
          (focusSessionsCompleted + 1) % preferences.longBreakInterval === 0;
        
        if (shouldTakeLongBreak) {
          startSession('long_break');
        } else {
          startSession('break');
        }
      }, 2000);
    }
  };

  const pauseSession = () => {
    setIsRunning(false);
    if (preferences.enableNotifications) {
      toast.info('Session paused');
    }
  };

  const resumeSession = () => {
    setIsRunning(true);
    if (preferences.enableNotifications) {
      toast.info('Session resumed');
    }
  };

  const resetSession = () => {
    setIsRunning(false);
    setCurrentSession(null);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!currentSession) return 0;
    return ((currentSession.duration - timeRemaining) / currentSession.duration) * 100;
  };

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'focus': return <Target className="h-4 w-4" />;
      case 'break': return <Coffee className="h-4 w-4" />;
      case 'long_break': return <Brain className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'focus': return 'bg-blue-100 text-blue-800';
      case 'break': return 'bg-green-100 text-green-800';
      case 'long_break': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            ADHD-Friendly Pacing
          </h1>
          <p className="text-gray-600">
            Structured focus and break sessions designed for optimal attention and productivity
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {focusSessionsCompleted} focus sessions completed today
        </Badge>
      </div>

      {/* Current Session */}
      {currentSession && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getSessionTypeIcon(currentSession.type)}
              Current {currentSession.type === 'focus' ? 'Focus' : 'Break'} Session
            </CardTitle>
            <CardDescription>
              {currentSession.type === 'focus' 
                ? 'Stay focused and avoid distractions'
                : 'Take a well-deserved break and recharge'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
                {formatTime(timeRemaining)}
              </div>
              <Progress value={getProgressPercentage()} className="h-3 mb-4" />
              <div className="flex justify-center gap-3">
                {isRunning ? (
                  <Button onClick={pauseSession} variant="outline" size="lg">
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeSession} size="lg">
                    <Play className="h-5 w-5 mr-2" />
                    Resume
                  </Button>
                )}
                <Button onClick={resetSession} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Controls */}
      {!currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Start a Session
            </CardTitle>
            <CardDescription>
              Choose the type of session you'd like to start
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => startSession('focus')}
                className="h-24 flex flex-col items-center justify-center gap-2"
                size="lg"
              >
                <Target className="h-8 w-8" />
                <div>
                  <div className="font-semibold">Focus Session</div>
                  <div className="text-sm opacity-80">{preferences.focusDuration} minutes</div>
                </div>
              </Button>
              
              <Button
                onClick={() => startSession('break')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                size="lg"
              >
                <Coffee className="h-8 w-8" />
                <div>
                  <div className="font-semibold">Short Break</div>
                  <div className="text-sm opacity-80">{preferences.shortBreakDuration} minutes</div>
                </div>
              </Button>
              
              <Button
                onClick={() => startSession('long_break')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                size="lg"
              >
                <Brain className="h-8 w-8" />
                <div>
                  <div className="font-semibold">Long Break</div>
                  <div className="text-sm opacity-80">{preferences.longBreakDuration} minutes</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Sessions
            </CardTitle>
            <CardDescription>
              Track your productivity and break patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionHistory.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSessionTypeIcon(session.type)}
                    <div>
                      <div className="font-medium">
                        {session.type === 'focus' ? 'Focus' : 
                         session.type === 'break' ? 'Short Break' : 'Long Break'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(session.duration)} • {new Date(parseInt(session.id)).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSessionTypeColor(session.type)}>
                      {session.type.replace('_', ' ')}
                    </Badge>
                    {session.completed && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADHD Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            ADHD-Friendly Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">During Focus Sessions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Remove distractions from your workspace</li>
                <li>• Use noise-canceling headphones if needed</li>
                <li>• Keep water and snacks nearby</li>
                <li>• Break large tasks into smaller chunks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">During Breaks:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Stand up and move around</li>
                <li>• Look away from screens</li>
                <li>• Do some light stretching</li>
                <li>• Hydrate and have a healthy snack</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
