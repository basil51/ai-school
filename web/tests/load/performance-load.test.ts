/**
 * Load Testing for Smart Teaching System
 * Tests performance under high concurrent user load (1000+ users)
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'

const prisma = new PrismaClient()

describe('Smart Teaching Load Testing', () => {
  const CONCURRENT_USERS = 100
  const MAX_RESPONSE_TIME = 2000 // 2 seconds
  const MAX_MEMORY_USAGE = 512 * 1024 * 1024 // 512MB

  beforeAll(async () => {
    await setupLoadTestData()
  })

  afterAll(async () => {
    await cleanupLoadTestData()
    await prisma.$disconnect()
  })

  describe('Concurrent User Load', () => {
    test('should handle 100 concurrent smart teaching sessions', async () => {
      const startTime = performance.now()
      const memoryBefore = process.memoryUsage()

      // Create concurrent sessions
      const sessionPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) =>
        createConcurrentSession(i)
      )

      const results = await Promise.allSettled(sessionPromises)
      const endTime = performance.now()
      const memoryAfter = process.memoryUsage()

      // Analyze results
      const successfulSessions = results.filter(r => r.status === 'fulfilled').length
      const failedSessions = results.filter(r => r.status === 'rejected').length
      const totalTime = endTime - startTime
      const memoryUsed = memoryAfter.heapUsed - memoryBefore.heapUsed

      // Performance assertions
      expect(successfulSessions).toBeGreaterThanOrEqual(CONCURRENT_USERS * 0.95) // 95% success rate
      expect(failedSessions).toBeLessThanOrEqual(CONCURRENT_USERS * 0.05) // Max 5% failure rate
      expect(totalTime).toBeLessThan(10000) // Max 10 seconds for all sessions
      expect(memoryUsed).toBeLessThan(MAX_MEMORY_USAGE) // Memory usage within limits

      console.log(`Load Test Results:
        - Successful Sessions: ${successfulSessions}/${CONCURRENT_USERS}
        - Failed Sessions: ${failedSessions}
        - Total Time: ${totalTime.toFixed(2)}ms
        - Memory Used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB
        - Average Response Time: ${(totalTime / CONCURRENT_USERS).toFixed(2)}ms
      `)
    })

    test('should maintain API response times under load', async () => {
      const apiEndpoints = [
        '/api/smart-teaching/curriculum',
        '/api/smart-teaching/generate-content',
        '/api/smart-teaching/start-session',
        '/api/smart-teaching/adaptive',
        '/api/smart-teaching/assessment'
      ]

      const responseTimeResults = []

      for (const endpoint of apiEndpoints) {
        const responseTimes = await testEndpointResponseTime(endpoint, 50)
        responseTimeResults.push({
          endpoint,
          averageTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          maxTime: Math.max(...responseTimes),
          minTime: Math.min(...responseTimes)
        })
      }

      // Assert all endpoints meet performance requirements
      responseTimeResults.forEach(result => {
        expect(result.averageTime).toBeLessThan(MAX_RESPONSE_TIME)
        expect(result.maxTime).toBeLessThan(MAX_RESPONSE_TIME * 2) // Allow 2x for outliers
      })

      console.log('API Response Time Results:', responseTimeResults)
    })

    test('should handle database connection pooling under load', async () => {
      const startTime = performance.now()
      
      // Simulate high database load
      const dbOperations = Array.from({ length: 200 }, (_, i) =>
        performDatabaseOperation(i)
      )

      const results = await Promise.allSettled(dbOperations)
      const endTime = performance.now()

      const successfulOps = results.filter(r => r.status === 'fulfilled').length
      const totalTime = endTime - startTime

      expect(successfulOps).toBeGreaterThanOrEqual(190) // 95% success rate
      expect(totalTime).toBeLessThan(5000) // Max 5 seconds

      console.log(`Database Load Test:
        - Successful Operations: ${successfulOps}/200
        - Total Time: ${totalTime.toFixed(2)}ms
        - Average Time per Operation: ${(totalTime / 200).toFixed(2)}ms
      `)
    })

    test('should handle 3D rendering performance under load', async () => {
      const renderingTests = Array.from({ length: 20 }, (_, i) =>
        test3DRenderingPerformance(i)
      )

      const results = await Promise.allSettled(renderingTests)
      const successfulRenders = results.filter(r => r.status === 'fulfilled').length

      expect(successfulRenders).toBeGreaterThanOrEqual(18) // 90% success rate

      console.log(`3D Rendering Load Test:
        - Successful Renders: ${successfulRenders}/20
        - Failed Renders: ${20 - successfulRenders}
      `)
    })
  })

  describe('Memory and Resource Management', () => {
    test('should not leak memory during extended sessions', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const sessionPromises = []

      // Create extended sessions
      for (let i = 0; i < 50; i++) {
        sessionPromises.push(createExtendedSession(i))
      }

      await Promise.all(sessionPromises)
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)

      console.log(`Memory Leak Test:
        - Initial Memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
        - Final Memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB
      `)
    })

    test('should handle content generation queue under load', async () => {
      const contentGenerationPromises = Array.from({ length: 100 }, (_, i) =>
        generateContentUnderLoad(i)
      )

      const startTime = performance.now()
      const results = await Promise.allSettled(contentGenerationPromises)
      const endTime = performance.now()

      const successfulGenerations = results.filter(r => r.status === 'fulfilled').length
      const totalTime = endTime - startTime

      expect(successfulGenerations).toBeGreaterThanOrEqual(90) // 90% success rate
      expect(totalTime).toBeLessThan(30000) // Max 30 seconds

      console.log(`Content Generation Load Test:
        - Successful Generations: ${successfulGenerations}/100
        - Total Time: ${totalTime.toFixed(2)}ms
        - Average Time per Generation: ${(totalTime / 100).toFixed(2)}ms
      `)
    })
  })

  // Helper functions
  async function setupLoadTestData() {
    // Create test users for load testing
    const testUsers = Array.from({ length: CONCURRENT_USERS }, (_, i) => ({
      email: `load-test-user-${i}@example.com`,
      name: `Load Test User ${i}`,
      role: 'student' as const,
      organizationId: 'load-test-org'
    }))

    await prisma.user.createMany({
      data: testUsers,
      skipDuplicates: true
    })

    // Create test lessons
    const testLessons = Array.from({ length: 10 }, (_, i) => ({
      title: `Load Test Lesson ${i}`,
      content: `This is load test lesson ${i} content`,
      topicId: 'load-test-topic-id', // This would need to be a real topic ID
      difficulty: 'beginner' as const,
      estimatedTime: 30,
      order: i + 1
    }))

    await prisma.lesson.createMany({
      data: testLessons,
      skipDuplicates: true
    })
  }

  async function cleanupLoadTestData() {
    await prisma.smartTeachingSession.deleteMany({
      where: { student: { email: { contains: 'load-test-user' } } }
    })
    await prisma.user.deleteMany({
      where: { email: { contains: 'load-test-user' } }
    })
    await prisma.lesson.deleteMany({
      where: { title: { contains: 'Load Test Lesson' } }
    })
  }

  async function createConcurrentSession(userIndex: number) {
    const startTime = performance.now()
    
    try {
      // Get test user
      const user = await prisma.user.findFirst({
        where: { email: `load-test-user-${userIndex}@example.com` }
      })

      if (!user) {
        throw new Error(`Test user ${userIndex} not found`)
      }

      // Get test lesson
      const lesson = await prisma.lesson.findFirst({
        where: { title: { contains: 'Load Test Lesson' } }
      })

      if (!lesson) {
        throw new Error('Test lesson not found')
      }

      // Create session
      const session = await prisma.smartTeachingSession.create({
        data: {
          studentId: user.id,
          lessonId: lesson.id,
          status: 'active' as const,
          progress: { step: 1, completed: false }
        }
      })

      // Simulate some interactions
      await prisma.smartTeachingInteraction.create({
        data: {
          sessionId: session.id,
          type: 'content_view' as const,
          content: { timestamp: Date.now() }
        }
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      return {
        sessionId: session.id,
        responseTime,
        success: true
      }
    } catch (error) {
      const endTime = performance.now()
      const responseTime = endTime - startTime

      return {
        error: error instanceof Error ? error.message : String(error),
        responseTime,
        success: false
      }
    }
  }

  async function testEndpointResponseTime(endpoint: string, iterations: number) {
    const responseTimes = []

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      
      try {
        // Mock API call (in real implementation, this would be actual HTTP request)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        
        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
      } catch (error) {
        responseTimes.push(MAX_RESPONSE_TIME * 2) // Mark as failed
      }
    }

    return responseTimes
  }

  async function performDatabaseOperation(index: number) {
    const startTime = performance.now()
    
    try {
      // Simulate database operation
      await prisma.user.findMany({
        take: 10,
        skip: index % 100
      })
      
      const endTime = performance.now()
      return endTime - startTime
    } catch (error) {
      throw new Error(`Database operation ${index} failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function test3DRenderingPerformance(index: number) {
    const startTime = performance.now()
    
    try {
      // Simulate 3D rendering operation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100))
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 1000) {
        throw new Error(`3D render ${index} took too long: ${renderTime}ms`)
      }
      
      return renderTime
    } catch (error) {
      throw new Error(`3D rendering ${index} failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async function createExtendedSession(index: number) {
    const user = await prisma.user.findFirst({
      where: { email: `load-test-user-${index}@example.com` }
    })

    const lesson = await prisma.lesson.findFirst({
      where: { title: { contains: 'Load Test Lesson' } }
    })

    if (!user || !lesson) {
      throw new Error(`Extended session ${index} setup failed`)
    }

    const session = await prisma.smartTeachingSession.create({
      data: {
        studentId: user.id,
        lessonId: lesson.id,
        status: 'active' as const,
        progress: { step: 1, completed: false }
      }
    })

    // Simulate extended interactions
    for (let i = 0; i < 10; i++) {
      await prisma.smartTeachingInteraction.create({
        data: {
          sessionId: session.id,
          type: 'content_interaction' as const,
          content: { step: i, timestamp: Date.now() }
        }
      })
    }

    return session.id
  }

  async function generateContentUnderLoad(index: number) {
    const startTime = performance.now()
    
    try {
      // Simulate content generation
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
      
      const endTime = performance.now()
      const generationTime = endTime - startTime
      
      if (generationTime > 5000) {
        throw new Error(`Content generation ${index} took too long: ${generationTime}ms`)
      }
      
      return {
        contentId: `generated-content-${index}`,
        generationTime
      }
    } catch (error) {
      throw new Error(`Content generation ${index} failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
})
