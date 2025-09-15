/**
 * Database Connection Test
 * Simple test to verify Prisma client works in Node.js environment
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('should connect to database successfully', async () => {
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    expect(result).toBeDefined()
  })

  test('should be able to query User table', async () => {
    const userCount = await prisma.user.count()
    expect(typeof userCount).toBe('number')
    expect(userCount).toBeGreaterThanOrEqual(0)
  })

  test('should be able to query Lesson table', async () => {
    const lessonCount = await prisma.lesson.count()
    expect(typeof lessonCount).toBe('number')
    expect(lessonCount).toBeGreaterThanOrEqual(0)
  })
})
