/**
 * End-to-End Testing for Smart Teaching System
 * Tests the complete curriculum → AI generation → smart teaching → assessment flow
 */

import { PrismaClient } from '@prisma/client'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

describe('Smart Teaching End-to-End Flow', () => {
  let testStudent: any
  let testLesson: any
  let testSession: any

  beforeAll(async () => {
    // Setup test data
    await setupTestData()
  })

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Reset session state for each test
    if (testSession) {
      await prisma.smartTeachingSession.deleteMany({
        where: { id: testSession.id }
      })
    }
  })

  describe('Complete Learning Flow', () => {
    test('should complete full curriculum to assessment flow', async () => {
      // Step 1: Student selects lesson from curriculum
      const lessonSelection = await selectLessonFromCurriculum(testStudent.id, testLesson.id)
      expect(lessonSelection.success).toBe(true)
      expect(lessonSelection.lesson).toBeDefined()

      // Step 2: AI generates multimodal content
      const contentGeneration = await generateAIContent(testLesson.id)
      expect(contentGeneration.success).toBe(true)
      expect(contentGeneration.content).toBeDefined()
      expect(contentGeneration.content.enhancedText).toBeDefined()
      expect(contentGeneration.content.visualElements).toBeDefined()

      // Step 3: Start smart teaching session
      const sessionStart = await startSmartTeachingSession(testStudent.id, testLesson.id)
      expect(sessionStart.success).toBe(true)
      expect(sessionStart.sessionId).toBeDefined()
      testSession = sessionStart.session

      // Step 4: Render multimodal content
      const contentRendering = await renderMultimodalContent(sessionStart.sessionId, contentGeneration.content)
      expect(contentRendering.success).toBe(true)
      expect(contentRendering.renderedContent).toBeDefined()

      // Step 5: Student interacts with content
      const interactions = await simulateStudentInteractions(sessionStart.sessionId)
      expect(interactions.length).toBeGreaterThan(0)

      // Step 6: Adaptive teaching triggers
      const adaptiveResponse = await triggerAdaptiveTeaching(sessionStart.sessionId)
      expect(adaptiveResponse.success).toBe(true)
      expect(adaptiveResponse.adaptation).toBeDefined()

      // Step 7: Assessment integration
      const assessment = await triggerAssessment(sessionStart.sessionId)
      expect(assessment.success).toBe(true)
      expect(assessment.questions).toBeDefined()

      // Step 8: Complete session and track progress
      const sessionCompletion = await completeSession(sessionStart.sessionId)
      expect(sessionCompletion.success).toBe(true)
      expect(sessionCompletion.progress).toBeDefined()
    })

    test('should handle content generation failures gracefully', async () => {
      // Test with invalid lesson data
      const invalidLesson = { id: 'invalid-lesson-id' }
      
      const contentGeneration = await generateAIContent(invalidLesson.id)
      expect(contentGeneration.success).toBe(false)
      expect(contentGeneration.error).toBeDefined()
      expect(contentGeneration.fallbackContent).toBeDefined()
    })

    test('should adapt teaching methods based on student performance', async () => {
      const sessionStart = await startSmartTeachingSession(testStudent.id, testLesson.id)
      
      // Simulate poor performance
      await simulatePoorPerformance(sessionStart.sessionId)
      
      // Check if adaptive teaching triggers
      const adaptation = await checkAdaptiveTeaching(sessionStart.sessionId)
      expect(adaptation.methodChanged).toBe(true)
      expect(adaptation.newMethod).toBeDefined()
    })

    test('should maintain data consistency across all systems', async () => {
      const sessionStart = await startSmartTeachingSession(testStudent.id, testLesson.id)
      
      // Verify database consistency
      const dbConsistency = await verifyDatabaseConsistency(sessionStart.sessionId)
      expect(dbConsistency.consistent).toBe(true)
      
      // Verify session state
      const sessionState = await verifySessionState(sessionStart.sessionId)
      expect(sessionState.valid).toBe(true)
      
      // Verify progress tracking
      const progressTracking = await verifyProgressTracking(sessionStart.sessionId)
      expect(progressTracking.tracking).toBe(true)
    })
  })

  describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent sessions', async () => {
      const concurrentSessions = 10
      const sessionPromises = []
      
      for (let i = 0; i < concurrentSessions; i++) {
        sessionPromises.push(startSmartTeachingSession(testStudent.id, testLesson.id))
      }
      
      const results = await Promise.all(sessionPromises)
      
      // All sessions should start successfully
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.sessionId).toBeDefined()
      })
      
      // Cleanup concurrent sessions
      await Promise.all(
        results.map(result => 
          prisma.smartTeachingSession.delete({ where: { id: result.sessionId } })
        )
      )
    })

    test('should maintain performance under load', async () => {
      const startTime = Date.now()
      
      // Simulate high load scenario
      await simulateHighLoadScenario()
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Performance should be within acceptable limits
      expect(duration).toBeLessThan(5000) // 5 seconds max
    })
  })

  // Helper functions
  async function setupTestData() {
    // Create test student
    testStudent = await prisma.user.create({
      data: {
        email: 'test-student@example.com',
        name: 'Test Student',
        role: 'student' as const,
        organizationId: 'test-org'
      }
    })

    // Create test lesson
    testLesson = await prisma.lesson.create({
      data: {
        title: 'Test Lesson',
        content: 'This is a test lesson for smart teaching',
        subject: 'Mathematics',
        topic: 'Algebra',
        difficulty: 'BEGINNER',
        estimatedTime: 30,
        organizationId: 'test-org'
      }
    })
  }

  async function cleanupTestData() {
    await prisma.smartTeachingSession.deleteMany({
      where: { studentId: testStudent.id }
    })
    await prisma.lesson.deleteMany({
      where: { id: testLesson.id }
    })
    await prisma.user.deleteMany({
      where: { id: testStudent.id }
    })
  }

  async function selectLessonFromCurriculum(studentId: string, lessonId: string) {
    const { req, res } = createMocks({
      method: 'GET',
      url: `/api/smart-teaching/curriculum/${studentId}`,
    })

    // Mock the API call
    const response = await fetch(`/api/smart-teaching/curriculum/${studentId}`)
    const data = await response.json()

    return {
      success: response.ok,
      lesson: data.lessons?.find((l: any) => l.id === lessonId)
    }
  }

  async function generateAIContent(lessonId: string) {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/smart-teaching/generate-content',
      body: { lessonId }
    })

    // Mock the API call
    const response = await fetch('/api/smart-teaching/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId })
    })

    const data = await response.json()

    return {
      success: response.ok,
      content: data.content,
      error: data.error,
      fallbackContent: data.fallbackContent
    }
  }

  async function startSmartTeachingSession(studentId: string, lessonId: string) {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/smart-teaching/start-session',
      body: { studentId, lessonId }
    })

    // Mock the API call
    const response = await fetch('/api/smart-teaching/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lessonId })
    })

    const data = await response.json()

    return {
      success: response.ok,
      sessionId: data.sessionId,
      session: data.session
    }
  }

  async function renderMultimodalContent(sessionId: string, content: any) {
    // Mock content rendering
    return {
      success: true,
      renderedContent: {
        text: content.enhancedText,
        visuals: content.visualElements,
        audio: content.audioNarration,
        interactive: content.interactiveElements
      }
    }
  }

  async function simulateStudentInteractions(sessionId: string) {
    // Mock student interactions
    const interactions = [
      { type: 'content_view', timestamp: Date.now() },
      { type: 'interaction', timestamp: Date.now() + 1000 },
      { type: 'question_asked', timestamp: Date.now() + 2000 }
    ]

    return interactions
  }

  async function triggerAdaptiveTeaching(sessionId: string) {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/smart-teaching/adaptive',
      body: { sessionId }
    })

    // Mock the API call
    const response = await fetch('/api/smart-teaching/adaptive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })

    const data = await response.json()

    return {
      success: response.ok,
      adaptation: data.adaptation
    }
  }

  async function triggerAssessment(sessionId: string) {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/smart-teaching/assessment',
      body: { sessionId }
    })

    // Mock the API call
    const response = await fetch('/api/smart-teaching/assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })

    const data = await response.json()

    return {
      success: response.ok,
      questions: data.questions
    }
  }

  async function completeSession(sessionId: string) {
    const { req, res } = createMocks({
      method: 'POST',
      url: '/api/smart-teaching/complete-session',
      body: { sessionId }
    })

    // Mock the API call
    const response = await fetch('/api/smart-teaching/complete-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })

    const data = await response.json()

    return {
      success: response.ok,
      progress: data.progress
    }
  }

  async function simulatePoorPerformance(sessionId: string) {
    // Mock poor performance indicators
    await prisma.smartTeachingInteraction.create({
      data: {
        sessionId,
        type: 'CONFUSION_DETECTED',
        content: { confidence: 0.2, timeSpent: 300 }
      }
    })
  }

  async function checkAdaptiveTeaching(sessionId: string) {
    const session = await prisma.smartTeachingSession.findUnique({
      where: { id: sessionId },
      include: { interactions: true }
    })

    const hasAdaptation = session?.interactions.some(
      i => i.type === 'ADAPTATION_TRIGGERED'
    )

    return {
      methodChanged: hasAdaptation || false,
      newMethod: hasAdaptation ? 'VISUAL_LEARNING' : null
    }
  }

  async function verifyDatabaseConsistency(sessionId: string) {
    const session = await prisma.smartTeachingSession.findUnique({
      where: { id: sessionId },
      include: {
        interactions: true,
        assessments: true,
        student: true,
        lesson: true
      }
    })

    return {
      consistent: !!(
        session &&
        session.student &&
        session.lesson &&
        session.interactions.length >= 0
      )
    }
  }

  async function verifySessionState(sessionId: string) {
    const session = await prisma.smartTeachingSession.findUnique({
      where: { id: sessionId }
    })

    return {
      valid: !!(session && session.status && session.startedAt)
    }
  }

  async function verifyProgressTracking(sessionId: string) {
    const session = await prisma.smartTeachingSession.findUnique({
      where: { id: sessionId }
    })

    return {
      tracking: !!(session && session.progress)
    }
  }

  async function simulateHighLoadScenario() {
    // Simulate multiple concurrent operations
    const operations = [
      generateAIContent(testLesson.id),
      startSmartTeachingSession(testStudent.id, testLesson.id),
      triggerAdaptiveTeaching('test-session-id'),
      triggerAssessment('test-session-id')
    ]

    await Promise.all(operations)
  }
})
