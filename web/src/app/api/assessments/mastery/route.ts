import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

// GET - Get mastery tracking data for a student or lesson
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const lessonId = searchParams.get('lessonId');
    const subjectId = searchParams.get('subjectId');
    const period = searchParams.get('period') || 'weekly';

    const userRole = (session as any).role;
    const userId = (session as any).user?.id;

    // Students can only see their own data
    if (userRole === 'student') {
      if (studentId && studentId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // For admin/teacher users, if no specific studentId is provided, 
    // we'll return aggregated data for all students
    const targetStudentId = userRole === 'student' ? userId : studentId;
    const isAggregatedView = userRole !== 'student' && !studentId;

    if (!targetStudentId && !isAggregatedView) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student progress data
    const studentProgress = await prisma.studentProgress.findMany({
      where: {
        ...(targetStudentId && { studentId: targetStudentId }),
        ...(lessonId && { lessonId })
      },
      include: {
        lesson: {
          include: {
            topic: {
              include: {
                subject: true
              }
            }
          }
        },
        ...(isAggregatedView && {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        })
      }
    });

    // Get assessment attempts
    const assessmentAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        ...(targetStudentId && { studentId: targetStudentId }),
        completedAt: { not: null },
        ...(lessonId && {
          assessment: {
            lessonId
          }
        })
      },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        },
        responses: {
          include: {
            question: true
          }
        },
        ...(isAggregatedView && {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        })
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Get student enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        ...(targetStudentId && { studentId: targetStudentId }),
        isActive: true,
        ...(subjectId && { subjectId })
      },
      include: {
        subject: {
          include: {
            topics: {
              include: {
                lessons: {
                  include: {
                    assessments: {
                      where: { isActive: true }
                    }
                  }
                }
              }
            }
          }
        },
        ...(isAggregatedView && {
          student: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        })
      }
    });

    // Calculate mastery metrics
    const masteryData = {
      overallProgress: calculateOverallProgress(studentProgress, assessmentAttempts),
      subjectProgress: calculateSubjectProgress(enrollments, studentProgress, assessmentAttempts),
      lessonMastery: calculateLessonMastery(studentProgress, assessmentAttempts),
      assessmentPerformance: calculateAssessmentPerformance(assessmentAttempts),
      learningVelocity: calculateLearningVelocity(studentProgress, assessmentAttempts, period),
      strengthsAndWeaknesses: analyzeStrengthsAndWeaknesses(assessmentAttempts),
      recommendations: generateRecommendations(studentProgress, assessmentAttempts)
    };

    return NextResponse.json(toSerializable(masteryData));
  } catch (error) {
    console.error('Error fetching mastery data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update mastery tracking (called when assessments are completed)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    const { attemptId, lessonId, studentId } = data;

    if (!attemptId || !lessonId || !studentId) {
      return NextResponse.json({ 
        error: 'Attempt ID, lesson ID, and student ID are required' 
      }, { status: 400 });
    }

    // Get the assessment attempt
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            lesson: {
              include: {
                topic: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        },
        responses: {
          include: {
            question: true
          }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Update student progress based on assessment result
    if (attempt.passed) {
      await prisma.studentProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId,
            lessonId
          }
        },
        update: {
          status: 'completed',
          completedAt: new Date()
        },
        create: {
          studentId,
          lessonId,
          status: 'completed',
          completedAt: new Date()
        }
      });
    } else {
      // Mark as failed and increment attempts
      await prisma.studentProgress.upsert({
        where: {
          studentId_lessonId: {
            studentId,
            lessonId
          }
        },
        update: {
          status: 'failed',
          attempts: { increment: 1 }
        },
        create: {
          studentId,
          lessonId,
          status: 'failed',
          attempts: 1
        }
      });
    }

    // Create or update learning analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.learningAnalytics.upsert({
      where: {
        studentId_dateRange: {
          studentId,
          dateRange: today
        }
      },
      update: {
        conceptsMastered: attempt.passed ? { increment: 1 } : undefined,
        assessmentScores: {
          push: attempt.score || 0
        },
        strugglingTopics: attempt.passed ? undefined : {
          push: attempt.assessment.lesson.topic.name
        }
      },
      create: {
        studentId,
        dateRange: today,
        conceptsMastered: attempt.passed ? 1 : 0,
        timeSpent: 0, // Will be calculated separately
        assessmentScores: [attempt.score || 0],
        strugglingTopics: attempt.passed ? [] : [attempt.assessment.lesson.topic.name],
        improvingTopics: []
      }
    });

    // Update success metrics
    const subjectId = attempt.assessment.lesson.topic.subjectId;
    const period = getCurrentPeriod();
    
    await prisma.successMetrics.upsert({
      where: {
        studentId_subjectId_period_startDate: {
          studentId,
          subjectId,
          period: 'weekly' as any,
          startDate: period.startDate
        }
      },
      update: {
        totalAssessments: { increment: 1 },
        passedAssessments: attempt.passed ? { increment: 1 } : undefined,
        masteryRate: attempt.passed ? undefined : {
          // Recalculate mastery rate
        }
      },
      create: {
        studentId,
        subjectId,
        period: 'weekly' as any,
        startDate: period.startDate,
        endDate: period.endDate,
        totalAssessments: 1,
        passedAssessments: attempt.passed ? 1 : 0,
        masteryRate: attempt.passed ? 1.0 : 0.0
      }
    });

    return NextResponse.json({ 
      message: 'Mastery tracking updated successfully',
      passed: attempt.passed,
      score: attempt.score
    });
  } catch (error) {
    console.error('Error updating mastery tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateOverallProgress(progress: any[], attempts: any[]) {
  // For aggregated view, we need to calculate averages across all students
  if (progress.length === 0 && attempts.length === 0) {
    return {
      lessonCompletionRate: 0,
      assessmentPassRate: 0,
      overallScore: 0
    };
  }

  // Group by student for aggregated calculations
  const studentProgressMap = new Map();
  const studentAttemptsMap = new Map();

  progress.forEach((p: any) => {
    const studentId = p.studentId;
    if (!studentProgressMap.has(studentId)) {
      studentProgressMap.set(studentId, []);
    }
    studentProgressMap.get(studentId)?.push(p);
  });

  attempts.forEach((a: any) => {
    const studentId = a.studentId;
    if (!studentAttemptsMap.has(studentId)) {
      studentAttemptsMap.set(studentId, []);
    }
    studentAttemptsMap.get(studentId)?.push(a);
  });

  // Calculate averages across students
  let totalLessonCompletionRate = 0;
  let totalAssessmentPassRate = 0;
  let totalOverallScore = 0;
  let studentCount = 0;

  const allStudentIds = new Set([...studentProgressMap.keys(), ...studentAttemptsMap.keys()]);
  
  allStudentIds.forEach(studentId => {
    const studentProgress = studentProgressMap.get(studentId) || [];
    const studentAttempts = studentAttemptsMap.get(studentId) || [];
    
    const totalLessons = studentProgress.length;
    const completedLessons = studentProgress.filter((p: any) => p.status === 'completed').length;
    const totalAssessments = studentAttempts.length;
    const passedAssessments = studentAttempts.filter((a: any) => a.passed).length;
    
    const lessonCompletionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
    const assessmentPassRate = totalAssessments > 0 ? (passedAssessments / totalAssessments) * 100 : 0;
    const overallScore = totalAssessments > 0 ? studentAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / totalAssessments : 0;
    
    totalLessonCompletionRate += lessonCompletionRate;
    totalAssessmentPassRate += assessmentPassRate;
    totalOverallScore += overallScore;
    studentCount++;
  });

  return {
    lessonCompletionRate: studentCount > 0 ? totalLessonCompletionRate / studentCount : 0,
    assessmentPassRate: studentCount > 0 ? totalAssessmentPassRate / studentCount : 0,
    overallScore: studentCount > 0 ? totalOverallScore / studentCount : 0
  };
}

function calculateSubjectProgress(enrollments: any[], progress: any[], attempts: any[]) {
  // Group enrollments by subject for aggregated view
  const subjectMap = new Map();
  
  enrollments.forEach((enrollment: any) => {
    const subjectId = enrollment.subjectId;
    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subjectId,
        subjectName: enrollment.subject.name,
        enrollments: []
      });
    }
    subjectMap.get(subjectId)?.enrollments.push(enrollment);
  });

  return Array.from(subjectMap.values()).map((subjectData: any) => {
    const subjectProgress = progress.filter((p: any) => 
      p.lesson.topic.subjectId === subjectData.subjectId
    );
    const subjectAttempts = attempts.filter((a: any) => 
      a.assessment.lesson.topic.subjectId === subjectData.subjectId
    );
    
    // Calculate total lessons across all enrollments for this subject
    const totalLessons = subjectData.enrollments.reduce((sum: number, enrollment: any) => 
      sum + enrollment.subject.topics.reduce((topicSum: number, topic: any) => 
        topicSum + topic.lessons.length, 0
      ), 0
    );
    
    const completedLessons = subjectProgress.filter((p: any) => p.status === 'completed').length;
    const passedAssessments = subjectAttempts.filter((a: any) => a.passed).length;
    
    return {
      subjectId: subjectData.subjectId,
      subjectName: subjectData.subjectName,
      lessonCompletionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      assessmentPassRate: subjectAttempts.length > 0 ? (passedAssessments / subjectAttempts.length) * 100 : 0,
      averageScore: subjectAttempts.length > 0 ? 
        subjectAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / subjectAttempts.length : 0
    };
  });
}

function calculateLessonMastery(progress: any[], attempts: any[]) {
  // Group by lesson for aggregated view
  const lessonMap = new Map();
  
  progress.forEach((p: any) => {
    const lessonId = p.lessonId;
    if (!lessonMap.has(lessonId)) {
      lessonMap.set(lessonId, {
        lessonId,
        lessonTitle: p.lesson.title,
        progressEntries: [],
        attempts: []
      });
    }
    lessonMap.get(lessonId)?.progressEntries.push(p);
  });

  attempts.forEach((a: any) => {
    const lessonId = a.assessment.lessonId;
    if (!lessonMap.has(lessonId)) {
      lessonMap.set(lessonId, {
        lessonId,
        lessonTitle: a.assessment.lesson.title,
        progressEntries: [],
        attempts: []
      });
    }
    lessonMap.get(lessonId)?.attempts.push(a);
  });

  return Array.from(lessonMap.values()).map((lessonData: any) => {
    const lessonAttempts = lessonData.attempts;
    const passedAttempts = lessonAttempts.filter((a: any) => a.passed);
    
    // Calculate aggregated metrics
    const totalAttempts = lessonData.progressEntries.reduce((sum: number, p: any) => sum + (p.attempts || 0), 0);
    const totalTimeSpent = lessonData.progressEntries.reduce((sum: number, p: any) => sum + (p.timeSpent || 0), 0);
    const averageScore = lessonAttempts.length > 0 ? 
      lessonAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / lessonAttempts.length : 0;
    
    // Determine overall status
    const completedEntries = lessonData.progressEntries.filter((p: any) => p.status === 'completed');
    const failedEntries = lessonData.progressEntries.filter((p: any) => p.status === 'failed');
    
    let overallStatus = 'not_started';
    if (completedEntries.length > 0) {
      overallStatus = 'completed';
    } else if (failedEntries.length > 0) {
      overallStatus = 'failed';
    } else if (lessonData.progressEntries.length > 0) {
      overallStatus = 'in_progress';
    }
    
    return {
      lessonId: lessonData.lessonId,
      lessonTitle: lessonData.lessonTitle,
      status: overallStatus,
      attempts: totalAttempts,
      masteryLevel: passedAttempts.length > 0 ? 'mastered' : 
                   lessonAttempts.length > 0 ? 'struggling' : 'not_attempted',
      lastScore: averageScore,
      timeSpent: totalTimeSpent
    };
  });
}

function calculateAssessmentPerformance(attempts: any[]) {
  const recentAttempts = attempts.slice(0, 10); // Last 10 attempts
  
  return {
    recentAverage: recentAttempts.length > 0 ? 
      recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length : 0,
    improvementTrend: calculateImprovementTrend(recentAttempts),
    strongestAreas: findStrongestAreas(attempts),
    weakestAreas: findWeakestAreas(attempts)
  };
}

function calculateLearningVelocity(progress: any[], attempts: any[], period: string) {
  // Calculate how quickly student is progressing through lessons
  const completedLessons = progress.filter(p => p.status === 'completed');
  const timeSpan = getTimeSpanForPeriod(period);
  
  return {
    lessonsPerWeek: completedLessons.length / (timeSpan / 7),
    averageTimePerLesson: completedLessons.length > 0 ? 
      completedLessons.reduce((sum, p) => sum + p.timeSpent, 0) / completedLessons.length : 0,
    acceleration: calculateAcceleration(completedLessons)
  };
}

function analyzeStrengthsAndWeaknesses(attempts: any[]) {
  const topicPerformance: { [key: string]: { correct: number; total: number; score: number } } = {};
  
  attempts.forEach(attempt => {
    const topic = attempt.assessment.lesson.topic.name;
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0, score: 0 };
    }
    
    topicPerformance[topic].total += 1;
    if (attempt.passed) {
      topicPerformance[topic].correct += 1;
    }
    topicPerformance[topic].score += attempt.score || 0;
  });
  
  const strengths = Object.entries(topicPerformance)
    .filter(([_, data]) => data.correct / data.total >= 0.8)
    .map(([topic, _]) => topic);
    
  const weaknesses = Object.entries(topicPerformance)
    .filter(([_, data]) => data.correct / data.total < 0.6)
    .map(([topic, _]) => topic);
  
  return { strengths, weaknesses, topicPerformance };
}

function generateRecommendations(progress: any[], attempts: any[]) {
  const recommendations = [];
  
  // Check for struggling lessons
  const strugglingLessons = progress.filter(p => 
    p.status === 'failed' && p.attempts > 1
  );
  
  if (strugglingLessons.length > 0) {
    recommendations.push({
      type: 'remediation',
      message: `Consider reviewing ${strugglingLessons.length} lesson(s) where you're struggling`,
      lessons: strugglingLessons.map(l => l.lesson.title)
    });
  }
  
  // Check for improvement opportunities
  const recentAttempts = attempts.slice(0, 5);
  const olderAttempts = attempts.slice(5, 10);
  
  if (recentAttempts.length > 0 && olderAttempts.length > 0) {
    const recentAvg = recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length;
    const olderAvg = olderAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / olderAttempts.length;
    
    if (recentAvg < olderAvg) {
      recommendations.push({
        type: 'performance',
        message: 'Your recent performance has declined. Consider reviewing previous lessons.',
        severity: 'warning'
      });
    }
  }
  
  return recommendations;
}

function calculateImprovementTrend(attempts: any[]) {
  if (attempts.length < 2) return 'insufficient_data';
  
  const scores = attempts.map(a => a.score || 0);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  if (secondAvg > firstAvg + 0.1) return 'improving';
  if (secondAvg < firstAvg - 0.1) return 'declining';
  return 'stable';
}

function findStrongestAreas(attempts: any[]) {
  const topicScores: { [key: string]: number[] } = {};
  
  attempts.forEach(attempt => {
    const topic = attempt.assessment.lesson.topic.name;
    if (!topicScores[topic]) topicScores[topic] = [];
    topicScores[topic].push(attempt.score || 0);
  });
  
  return Object.entries(topicScores)
    .map(([topic, scores]) => ({
      topic,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3)
    .map(item => item.topic);
}

function findWeakestAreas(attempts: any[]) {
  const topicScores: { [key: string]: number[] } = {};
  
  attempts.forEach(attempt => {
    const topic = attempt.assessment.lesson.topic.name;
    if (!topicScores[topic]) topicScores[topic] = [];
    topicScores[topic].push(attempt.score || 0);
  });
  
  return Object.entries(topicScores)
    .map(([topic, scores]) => ({
      topic,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }))
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 3)
    .map(item => item.topic);
}

function calculateAcceleration(completedLessons: any[]) {
  if (completedLessons.length < 3) return 0;
  
  const completionDates = completedLessons
    .map(l => new Date(l.completedAt || l.startedAt))
    .sort((a, b) => a.getTime() - b.getTime());
  
  const intervals = [];
  for (let i = 1; i < completionDates.length; i++) {
    intervals.push(completionDates[i].getTime() - completionDates[i-1].getTime());
  }
  
  if (intervals.length < 2) return 0;
  
  const recentInterval = intervals[intervals.length - 1];
  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  
  return (averageInterval - recentInterval) / averageInterval;
}

function getTimeSpanForPeriod(period: string) {
  switch (period) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    default: return 7;
  }
}

function getCurrentPeriod() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    startDate: startOfWeek,
    endDate: endOfWeek
  };
}
