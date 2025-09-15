import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
//import { z } from 'zod';

// GET /api/ab-testing/experiments/[id] - Get specific experiment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { id: true, name: true, email: true }
        },
        variants: {
          include: {
            _count: {
              select: { participants: true }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true }
            },
            variant: {
              select: { id: true, name: true, variantType: true }
            },
            _count: {
              select: { interactions: true }
            }
          },
          take: 50, // Limit for performance
          orderBy: { enrolledAt: 'desc' }
        },
        results: {
          include: {
            variant: {
              select: { id: true, name: true, variantType: true }
            }
          },
          orderBy: { calculatedAt: 'desc' }
        },
        _count: {
          select: { participants: true, results: true }
        }
      }
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    return NextResponse.json(experiment);
  } catch (error) {
    console.error('Error fetching experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ab-testing/experiments/[id] - Delete experiment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super_admins can delete experiments
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const experiment = await prisma.aBTestExperiment.findUnique({
      where: { id },
      select: { id: true, status: true, _count: { select: { participants: true } } }
    });

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    // Cannot delete experiments with participants
    if (experiment._count.participants > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete experiment with participants. Archive it instead.' 
      }, { status: 400 });
    }

    await prisma.aBTestExperiment.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Experiment deleted successfully' });
  } catch (error) {
    console.error('Error deleting experiment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
