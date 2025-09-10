import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createTestSchema = z.object({
  testType: z.enum([
    'automated',
    'manual',
    'user_testing',
    'screen_reader_testing',
    'keyboard_testing',
    'color_contrast_testing',
  ]),
  testName: z.string().min(1),
  description: z.string().min(1),
  testUrl: z.string().url(),
  testResults: z.record(z.string(), z.any()),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  issues: z.record(z.string(), z.any()).optional(),
  recommendations: z.record(z.string(), z.any()).optional(),
});

const updateTestSchema = createTestSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testType = searchParams.get('testType');
    const passed = searchParams.get('passed');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const where: any = {
      organizationId: user.organizationId,
    };

    if (testType) {
      where.testType = testType;
    }

    if (passed !== null) {
      where.passed = passed === 'true';
    }

    const tests = await prisma.accessibilityTest.findMany({
      where,
      include: {
        tester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { testDate: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.accessibilityTest.count({ where });

    return NextResponse.json({
      tests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching accessibility tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accessibility tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTestSchema.parse(body);

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    });

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 400 });
    }

    const test = await prisma.accessibilityTest.create({
      data: {
        ...validatedData,
        organizationId: user.organizationId,
        testedBy: session.user.id,
      },
      include: {
        tester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating accessibility test:', error);
    return NextResponse.json(
      { error: 'Failed to create accessibility test' },
      { status: 500 }
    );
  }
}
