import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRelationshipSchema = z.object({
  guardianEmail: z.string().email(),
  studentEmail: z.string().email(),
});

const updateRelationshipSchema = z.object({
  relationshipId: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'revoked']),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const relationships = await prisma.guardianRelationship.findMany({
      include: {
        guardian: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(relationships);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }
    console.error('Error fetching guardian relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guardianEmail, studentEmail } = createRelationshipSchema.parse(body);

    // Check if guardian and student exist
    const guardian = await prisma.user.findUnique({
      where: { email: guardianEmail },
    });

    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
    });

    if (!guardian) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      );
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (guardian.role !== 'guardian') {
      return NextResponse.json(
        { error: 'User is not a guardian' },
        { status: 400 }
      );
    }

    if (student.role !== 'student') {
      return NextResponse.json(
        { error: 'User is not a student' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.guardianRelationship.findUnique({
      where: {
        guardianId_studentId: {
          guardianId: guardian.id,
          studentId: student.id,
        },
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { error: 'Relationship already exists' },
        { status: 409 }
      );
    }

    // Create the relationship
    const relationship = await prisma.guardianRelationship.create({
      data: {
        guardianId: guardian.id,
        studentId: student.id,
        status: 'pending',
      },
      include: {
        guardian: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(relationship, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error creating guardian relationship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { relationshipId, status } = updateRelationshipSchema.parse(body);

    const relationship = await prisma.guardianRelationship.update({
      where: { id: relationshipId },
      data: { status },
      include: {
        guardian: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(relationship);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error('Error updating guardian relationship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
