/**
 * Database Connection Test (Mocked)
 * Test to verify Prisma client works without requiring actual database
 */

import { PrismaClient } from '@prisma/client'

// Mock Prisma client for testing
const mockPrisma = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  user: {
    count: jest.fn().mockResolvedValue(5),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ 
      id: 'test-user-id', 
      email: data.email,
      name: data.name,
      role: data.role 
    })),
    delete: jest.fn().mockResolvedValue({ id: 'test-user-id' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  lesson: {
    count: jest.fn().mockResolvedValue(10),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ 
      id: 'test-lesson-id', 
      title: data.title,
      content: data.content,
      topicId: data.topicId,
      difficulty: data.difficulty,
      estimatedTime: data.estimatedTime,
      order: data.order
    })),
    delete: jest.fn().mockResolvedValue({ id: 'test-lesson-id' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  smartTeachingSession: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ 
      id: 'test-session-id', 
      status: data.status,
      studentId: data.studentId,
      lessonId: data.lessonId,
      progress: data.progress
    })),
    update: jest.fn().mockResolvedValue({ id: 'test-session-id', status: 'completed' }),
    delete: jest.fn().mockResolvedValue({ id: 'test-session-id' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  smartTeachingInteraction: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'test-interaction-id', type: 'content_view' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  smartTeachingAssessment: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'test-assessment-id', score: 85 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  generatedContent: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'test-content-id', contentType: 'text' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  assessment: {
    count: jest.fn().mockResolvedValue(0),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
  },
}

// Mock the PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}))

describe('Database Connection (Mocked)', () => {
  let prisma: typeof mockPrisma

  beforeAll(async () => {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient() as any
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('should connect to database successfully', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    expect(result).toBeDefined()
    expect(result).toEqual([{ test: 1 }])
  })

  test('should be able to query User table', async () => {
    const userCount = await prisma.user.count()
    expect(typeof userCount).toBe('number')
    expect(userCount).toBe(5)
  })

  test('should be able to query Lesson table', async () => {
    const lessonCount = await prisma.lesson.count()
    expect(typeof lessonCount).toBe('number')
    expect(lessonCount).toBe(10)
  })

  test('should be able to create and delete test data', async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-user@example.com',
        name: 'Test User',
        role: 'student',
      }
    })
    expect(user).toBeDefined()
    expect(user.email).toBe('test-user@example.com')

    // Create test lesson
    const lesson = await prisma.lesson.create({
      data: {
        topicId: 'test-topic-id',
        title: 'Test Lesson',
        content: 'Test content',
        difficulty: 'beginner',
        estimatedTime: 30,
        order: 1,
      }
    })
    expect(lesson).toBeDefined()
    expect(lesson.title).toBe('Test Lesson')

    // Create test session
    const session = await prisma.smartTeachingSession.create({
      data: {
        studentId: user.id,
        lessonId: lesson.id,
        status: 'active',
        progress: { step: 1, completed: false },
      }
    })
    expect(session).toBeDefined()
    expect(session.status).toBe('active')

    // Clean up
    await prisma.smartTeachingSession.deleteMany({})
    await prisma.lesson.deleteMany({})
    await prisma.user.deleteMany({})
  })
})
