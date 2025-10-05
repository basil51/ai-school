import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 100);
    const role = searchParams.get('role');
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search');

    const where: any = {};
    if (role && role !== 'all') {
      where.role = role;
    }
    if (organizationId && organizationId !== 'all') {
      where.organizationId = organizationId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json(toSerializable({
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items: users,
    }));
  } catch (error) {
    console.error('Error fetching users (super-admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


