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

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Verify the room belongs to the user's organization
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        organizationId: context.organizationId!,
        isActive: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get participants
    const participants = await prisma.chatParticipant.findMany({
      where: {
        roomId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return NextResponse.json(toSerializable(participants));
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 400 });
    }

    // Only teachers and admins can add participants
    if (!['teacher', 'admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { roomId, userId } = await request.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: 'Room ID and User ID are required' }, { status: 400 });
    }

    // Verify the room belongs to the user's organization
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        organizationId: context.organizationId!,
        isActive: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify the user belongs to the same organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: context.organizationId!,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already a participant
    const existingParticipant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId,
        isActive: true,
      },
    });

    if (existingParticipant) {
      return NextResponse.json({ error: 'User is already a participant' }, { status: 409 });
    }

    // Add user to the room
    const participant = await prisma.chatParticipant.create({
      data: {
        roomId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(toSerializable(participant), { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
    const userId = searchParams.get('userId');

    if (!roomId || !userId) {
      return NextResponse.json({ error: 'Room ID and User ID are required' }, { status: 400 });
    }

    // Verify the room belongs to the user's organization
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        organizationId: context.organizationId!,
        isActive: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only teachers and admins can remove participants, or users can remove themselves
    if (!['teacher', 'admin', 'super_admin'].includes(context.userRole) && context.userId !== userId) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Find and deactivate the participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Deactivate the participant
    await prisma.chatParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ message: 'Participant removed successfully' });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
