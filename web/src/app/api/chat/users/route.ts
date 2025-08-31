import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrganizationContext } from '@/lib/organization';
import { toSerializable } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    // Get all users in the organization
    const users = await prisma.user.findMany({
      where: {
        organizationId: context.organizationId!,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // If roomId is provided, also get current participants to show who's already in the room
    let currentParticipants: string[] = [];
    if (roomId) {
      const participants = await prisma.chatParticipant.findMany({
        where: {
          roomId,
          isActive: true,
        },
        select: {
          userId: true,
        },
      });
      currentParticipants = participants.map(p => p.userId);
    }

    return NextResponse.json(toSerializable({
      users,
      currentParticipants,
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
