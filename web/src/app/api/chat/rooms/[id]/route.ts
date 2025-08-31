import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrganizationContext } from '@/lib/organization';
import { toSerializable } from '@/lib/utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 400 });
    }

    const { id: roomId } = await params;

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

    // Only room creators, teachers, and admins can delete rooms
    if (!['teacher', 'admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user is the room creator or has admin privileges
    const isRoomCreator = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: context.userId,
        isActive: true,
      },
    });

    if (!isRoomCreator && !['admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Only room creators can delete rooms' }, { status: 403 });
    }

    // Soft delete the room (set isActive to false)
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { isActive: false },
    });

    // Deactivate all participants
    await prisma.chatParticipant.updateMany({
      where: { roomId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const context = await getOrganizationContext();
    
    if (!context) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 400 });
    }

    const { id: roomId } = await params;
    const { name, description } = await request.json();

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

    // Only room creators, teachers, and admins can update rooms
    if (!['teacher', 'admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if user is the room creator or has admin privileges
    const isRoomCreator = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId: context.userId,
        isActive: true,
      },
    });

    if (!isRoomCreator && !['admin', 'super_admin'].includes(context.userRole)) {
      return NextResponse.json({ error: 'Only room creators can update rooms' }, { status: 403 });
    }

    // Update the room
    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        name: name?.trim() || room.name,
        description: description?.trim() || room.description,
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

    return NextResponse.json(toSerializable(updatedRoom));
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
