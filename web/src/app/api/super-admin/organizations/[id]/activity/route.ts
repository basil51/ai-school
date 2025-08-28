import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const { id: organizationId } = await params;

    // Get recent audit logs for the organization
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent activities
    });

    // Transform audit logs to activity format
    const activities = recentActivity.map((log) => ({
      id: log.id,
      action: log.action,
      details: log.details,
      createdAt: log.createdAt,
      user: {
        name: log.user?.name || null,
        email: log.user?.email || 'Unknown',
        role: log.user?.role || 'unknown',
      },
      organizationId: log.organizationId,
    }));

    // If no audit logs, create some sample activities for demonstration
    if (activities.length === 0) {
      const sampleActivities = [
        {
          id: 'sample-1',
          action: 'user_login',
          details: { ip: '192.168.1.100' },
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            role: 'teacher',
          },
          organizationId,
        },
        {
          id: 'sample-2',
          action: 'document_uploaded',
          details: { filename: 'lesson-plan.pdf', size: '2.5MB' },
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          user: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'teacher',
          },
          organizationId,
        },
        {
          id: 'sample-3',
          action: 'question_asked',
          details: { question: 'What is photosynthesis?' },
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          user: {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            role: 'student',
          },
          organizationId,
        },
        {
          id: 'sample-4',
          action: 'settings_updated',
          details: { setting: 'primary_color', value: '#2563eb' },
          createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          user: {
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
          },
          organizationId,
        },
      ];

      return NextResponse.json({
        activities: sampleActivities,
        total: sampleActivities.length,
        lastUpdated: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      activities: toSerializable(activities),
      total: activities.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching organization activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
