import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrganizationContext } from '@/lib/organization';
import { toSerializable } from '@/lib/utils';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 400 });
    }

    // Get chat rooms for the organization
    const rooms = await prisma.chatRoom.findMany({
      where: {
        organizationId: context.organizationId!,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            messages: true,
            participants: true,
          },
        },
        participants: {
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(toSerializable(rooms));
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
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

    // Only teachers and admins can create chat rooms
    if (!['teacher', 'admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // Check if room name already exists in the organization
    const existingRoom = await prisma.chatRoom.findFirst({
      where: {
        organizationId: context.organizationId!,
        name: name.trim(),
        isActive: true,
      },
    });

    if (existingRoom) {
      return NextResponse.json({ error: 'Room name already exists' }, { status: 409 });
    }

    // Create the chat room
    const room = await prisma.chatRoom.create({
      data: {
        organizationId: context.organizationId!,
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        _count: {
          select: {
            messages: true,
            participants: true,
          },
        },
        participants: {
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
        },
      },
    });

    return NextResponse.json(toSerializable(room), { status: 201 });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
