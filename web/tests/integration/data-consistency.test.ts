/**
 * Integration Testing for Data Consistency
 * Verifies data consistency across all smart teaching systems
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Smart Teaching Data Consistency Integration Tests', () => {
  let testStudent: any
  let testLesson: any
  let testSession: any

  beforeAll(async () => {
    await setupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
  })

  describe('Database Consistency', () => {
    test('should maintain referential integrity across all tables', async () => {
      // Create a complete smart teaching session with all related data
      const session = await createCompleteSession()
      
      // Verify all foreign key relationships
      const sessionWithRelations = await prisma.smartTeachingSession.findUnique({
        where: { id: session.id },
        include: {
          student: true,
          lesson: true,
          interactions: true,
          assessments: true
        }
      })

      expect(sessionWithRelations).toBeDefined()
      expect(sessionWithRelations?.student).toBeDefined()
      expect(sessionWithRelations?.lesson).toBeDefined()
      expect(sessionWithRelations?.student.id).toBe(testStudent.id)
      expect(sessionWithRelations?.lesson.id).toBe(testLesson.id)
    })

    test('should handle cascading deletes correctly', async () => {
      const session = await createCompleteSession()
      
      // Delete the student
      await prisma.user.delete({
        where: { id: testStudent.id }
      })

      // Verify that related sessions are handled appropriately
      const remainingSessions = await prisma.smartTeachingSession.findMany({
        where: { studentId: testStudent.id }
      })

      // Sessions should either be deleted or marked as inactive
      expect(remainingSessions.length).toBe(0)
    })

    test('should maintain data consistency during concurrent operations', async () => {
      const concurrentOperations = [
        updateSessionProgress('progress-update-1'),
        updateSessionProgress('progress-update-2'),
        addInteraction('interaction-1'),
        addInteraction('interaction-2'),
        updateAssessment('assessment-update-1')
      ]

      const results = await Promise.allSettled(concurrentOperations)
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })

      // Verify final state is consistent
      const finalSession = await prisma.smartTeachingSession.findUnique({
        where: { id: testSession.id },
        include: {
          interactions: true,
          assessments: true
        }
      })

      expect(finalSession).toBeDefined()
      expect(finalSession.interactions.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Session State Management', () => {
    test('should maintain consistent session state across operations', async () => {
      const session = await createCompleteSession()
      
      // Perform various operations
      await updateSessionProgress('step-1')
      await addInteraction('content-view')
      await updateSessionProgress('step-2')
      await addInteraction('question-asked')
      await updateAssessment('quiz-completed')

      // Verify session state consistency
      const finalSession = await prisma.smartTeachingSession.findUnique({
        where: { id: session.id },
        include: {
          interactions: true,
          assessments: true
        }
      })

      expect(finalSession?.status).toBe('active')
      expect(finalSession.progress).toBeDefined()
      expect(finalSession.interactions.length).toBe(2)
      expect(finalSession.assessments.length).toBe(1)
    })

    test('should handle session state transitions correctly', async () => {
      const session = await createCompleteSession()
      
      // Test state transitions
      await transitionSessionState(session.id, 'PAUSED')
      await transitionSessionState(session.id, 'ACTIVE')
      await transitionSessionState(session.id, 'COMPLETED')

      const finalSession = await prisma.smartTeachingSession.findUnique({
        where: { id: session.id }
      })

      expect(finalSession?.status).toBe('completed')
      expect(finalSession?.completedAt).toBeDefined()
    })
  })

  describe('Progress Tracking Consistency', () => {
    test('should maintain accurate progress tracking', async () => {
      const session = await createCompleteSession()
      
      // Simulate learning progress
      const progressSteps = [
        { step: 1, completed: false, timeSpent: 0 },
        { step: 2, completed: true, timeSpent: 120 },
        { step: 3, completed: true, timeSpent: 240 },
        { step: 4, completed: false, timeSpent: 300 }
      ]

      for (const progress of progressSteps) {
        await updateSessionProgress(progress)
      }

      const finalSession = await prisma.smartTeachingSession.findUnique({
        where: { id: session.id }
      })

      expect(finalSession?.progress).toEqual(progressSteps[3])
    })

    test('should calculate learning metrics correctly', async () => {
      const session = await createCompleteSession()
      
      // Add various interactions
      await addInteraction('content-view', { timeSpent: 30 })
      await addInteraction('question-asked', { confidence: 0.7 })
      await addInteraction('answer-correct', { timeSpent: 15 })
      await addInteraction('content-view', { timeSpent: 45 })

      // Calculate metrics
      const metrics = await calculateLearningMetrics(session.id)

      expect(metrics.totalTimeSpent).toBe(90)
      expect(metrics.interactionCount).toBe(4)
      expect(metrics.averageConfidence).toBe(0.7)
    })
  })

  describe('Assessment Integration Consistency', () => {
    test('should maintain assessment data consistency', async () => {
      const session = await createCompleteSession()
      
      // Create assessment
      const assessment = await createAssessment(session.id, {
        questions: [
          { id: 'q1', type: 'multiple-choice', correct: true },
          { id: 'q2', type: 'short-answer', correct: false },
          { id: 'q3', type: 'multiple-choice', correct: true }
        ]
      })

      // Verify assessment data
      const assessmentData = await prisma.smartTeachingAssessment.findUnique({
        where: { id: assessment.id }
      })

      expect(assessmentData).toBeDefined()
      expect(assessmentData?.score).toBe(66.67) // 2/3 correct
      expect(assessmentData?.completedAt).toBeDefined()
    })

    test('should update session progress based on assessment results', async () => {
      const session = await createCompleteSession()
      
      // Create assessment with poor performance
      await createAssessment(session.id, {
        questions: [
          { id: 'q1', type: 'multiple-choice', correct: false },
          { id: 'q2', type: 'short-answer', correct: false }
        ]
      })

      // Check if adaptive teaching was triggered
      const adaptiveInteractions = await prisma.smartTeachingInteraction.findMany({
        where: {
          sessionId: session.id,
          type: 'ADAPTATION_TRIGGERED'
        }
      })

      expect(adaptiveInteractions.length).toBeGreaterThan(0)
    })
  })

  describe('Content Generation Consistency', () => {
    test('should maintain content generation metadata consistency', async () => {
      const content = await generateTestContent()
      
      // Verify content metadata
      const contentData = await prisma.generatedContent.findUnique({
        where: { id: content.id }
      })

      expect(contentData).toBeDefined()
      expect(contentData?.lessonId).toBe(testLesson.id)
      expect(contentData?.contentType).toBeDefined()
      expect(contentData?.metadata).toBeDefined()
      expect(contentData?.createdAt).toBeDefined()
    })

    test('should handle content regeneration consistently', async () => {
      const originalContent = await generateTestContent()
      
      // Regenerate content
      const regeneratedContent = await regenerateContent(originalContent.id)
      
      // Verify both versions exist and are linked correctly
      const original = await prisma.generatedContent.findUnique({
        where: { id: originalContent.id }
      })
      
      const regenerated = await prisma.generatedContent.findUnique({
        where: { id: regeneratedContent.id }
      })

      expect(original).toBeDefined()
      expect(regenerated).toBeDefined()
      expect(regenerated?.lessonId).toBe(original?.lessonId)
    })
  })

  // Helper functions
  async function setupTestData() {
    // Create test student
    testStudent = await prisma.user.create({
      data: {
        email: 'consistency-test-student@example.com',
        name: 'Consistency Test Student',
        role: 'student' as const,
        organizationId: 'consistency-test-org'
      }
    })

    // Create test lesson
    testLesson = await prisma.lesson.create({
      data: {
        title: 'Consistency Test Lesson',
        content: 'This is a consistency test lesson',
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'BEGINNER',
        estimatedTime: 30,
        organizationId: 'consistency-test-org'
      }
    })
  }

  async function cleanupTestData() {
    await prisma.smartTeachingSession.deleteMany({
      where: { studentId: testStudent.id }
    })
    await prisma.generatedContent.deleteMany({
      where: { lessonId: testLesson.id }
    })
    await prisma.lesson.deleteMany({
      where: { id: testLesson.id }
    })
    await prisma.user.deleteMany({
      where: { id: testStudent.id }
    })
  }

  async function createCompleteSession() {
    testSession = await prisma.smartTeachingSession.create({
      data: {
        studentId: testStudent.id,
        lessonId: testLesson.id,
        status: 'active' as const,
        progress: { step: 1, completed: false, timeSpent: 0 }
      }
    })

    return testSession
  }

  async function updateSessionProgress(progressData: any) {
    return await prisma.smartTeachingSession.update({
      where: { id: testSession.id },
      data: { progress: progressData }
    })
  }

  async function addInteraction(type: string, content: any = {}) {
    return await prisma.smartTeachingInteraction.create({
      data: {
        sessionId: testSession.id,
        type: type as any,
        content: { ...content, timestamp: Date.now() }
      }
    })
  }

  async function updateAssessment(assessmentData: any) {
    return await prisma.smartTeachingAssessment.create({
      data: {
        sessionId: testSession.id,
        score: assessmentData.score || 0,
        questions: assessmentData.questions || [],
        completedAt: new Date()
      }
    })
  }

  async function transitionSessionState(sessionId: string, status: string) {
    const updateData: any = { status }
    
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    return await prisma.smartTeachingSession.update({
      where: { id: sessionId },
      data: updateData
    })
  }

  async function calculateLearningMetrics(sessionId: string) {
    const interactions = await prisma.smartTeachingInteraction.findMany({
      where: { sessionId }
    })

    const totalTimeSpent = interactions.reduce((total, interaction) => {
      return total + (interaction.content?.timeSpent || 0)
    }, 0)

    const confidenceScores = interactions
      .map(i => i.content?.confidence)
      .filter(c => c !== undefined)

    const averageConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0

    return {
      totalTimeSpent,
      interactionCount: interactions.length,
      averageConfidence
    }
  }

  async function createAssessment(sessionId: string, assessmentData: any) {
    const correctAnswers = assessmentData.questions.filter((q: any) => q.correct).length
    const totalQuestions = assessmentData.questions.length
    const score = (correctAnswers / totalQuestions) * 100

    return await prisma.smartTeachingAssessment.create({
      data: {
        sessionId,
        score,
        questions: assessmentData.questions,
        completedAt: new Date()
      }
    })
  }

  async function generateTestContent() {
    return await prisma.generatedContent.create({
      data: {
        lessonId: testLesson.id,
        contentType: 'MULTIMODAL',
        content: {
          enhancedText: 'Enhanced lesson content',
          visualElements: [],
          audioNarration: 'Audio narration text',
          interactiveElements: []
        },
        metadata: {
          generationTime: Date.now(),
          quality: 0.95,
          version: '1.0'
        }
      }
    })
  }

  async function regenerateContent(originalContentId: string) {
    const original = await prisma.generatedContent.findUnique({
      where: { id: originalContentId }
    })

    return await prisma.generatedContent.create({
      data: {
        lessonId: original?.lessonId,
        contentType: original?.contentType,
        content: {
          ...original?.content,
          enhancedText: 'Regenerated enhanced lesson content'
        },
        metadata: {
          ...original?.metadata,
          generationTime: Date.now(),
          version: '2.0',
          parentContentId: originalContentId
        }
      }
    })
  }
})
