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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

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

    // Check if user is a participant in the room
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: context.userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalMessages = await prisma.chatMessage.count({
      where: {
        roomId,
      },
    });

    // Update last read timestamp for the user
    await prisma.chatParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json(toSerializable({
      messages: messages.reverse(), // Show oldest first
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
      },
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
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

    const { roomId, content, messageType = 'text' } = await request.json();

    if (!roomId || !content) {
      return NextResponse.json({ error: 'Room ID and content are required' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
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

    // Check if user is a participant in the room
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: context.userId,
        isActive: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: context.userId,
        content: content.trim(),
        messageType: messageType as 'text' | 'system' | 'notification',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(toSerializable(message), { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
