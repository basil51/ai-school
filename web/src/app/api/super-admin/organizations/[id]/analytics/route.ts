import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const organizationId = params.id;

    // Get organization with basic info
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get user statistics by role
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      where: { organizationId },
      _count: {
        role: true,
      },
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await prisma.auditLog.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Get document statistics
    const documentStats = await prisma.ragDocument.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: {
        status: true,
      },
    });

    // Get storage usage breakdown
    const storageBreakdown = await prisma.ragDocument.aggregate({
      where: { organizationId },
      _sum: {
        fileSize: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate usage percentages
    const settings = organization.settings;
    const usagePercentages = {
      users: settings ? Math.round((organization._count.users / settings.maxUsers) * 100) : 0,
      documents: settings ? Math.round((organization._count.documents / settings.maxDocuments) * 100) : 0,
      questions: settings ? Math.round((organization.monthlyQuestions / settings.maxQuestionsPerMonth) * 100) : 0,
      storage: settings ? Math.round(Number((organization.storageUsed * BigInt(100)) / settings.maxStorageBytes)) : 0,
    };

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await prisma.auditLog.groupBy({
      by: ['action', 'createdAt'],
      where: {
        organizationId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        action: true,
      },
    });

    // Format monthly trends
    const trends = monthlyTrends.reduce((acc, item) => {
      const month = item.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          userRegistrations: 0,
          documentUploads: 0,
          questionsAsked: 0,
          adminActions: 0,
        };
      }
      
      switch (item.action) {
        case 'user_created':
          acc[month].userRegistrations += item._count.action;
          break;
        case 'document_uploaded':
          acc[month].documentUploads += item._count.action;
          break;
        case 'question_asked':
          acc[month].questionsAsked += item._count.action;
          break;
        default:
          acc[month].adminActions += item._count.action;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const analytics = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        tier: organization.tier,
        isActive: organization.isActive,
        createdAt: organization.createdAt,
        primaryColor: organization.primaryColor,
        logoUrl: organization.logoUrl,
      },
      usage: {
        current: {
          users: organization._count.users,
          documents: organization._count.documents,
          questions: organization.monthlyQuestions,
          storage: Number(organization.storageUsed),
        },
        limits: settings ? {
          maxUsers: settings.maxUsers,
          maxDocuments: settings.maxDocuments,
          maxQuestionsPerMonth: settings.maxQuestionsPerMonth,
          maxStorageBytes: Number(settings.maxStorageBytes),
        } : null,
        percentages: usagePercentages,
      },
      userStats: userStats.map(stat => ({
        role: stat.role,
        count: stat._count.role,
      })),
      documentStats: documentStats.map(stat => ({
        status: stat.status,
        count: stat._count.status,
      })),
      storage: {
        totalSize: Number(storageBreakdown._sum.fileSize || 0),
        documentCount: storageBreakdown._count.id,
        averageSize: storageBreakdown._count.id > 0 
          ? Number(storageBreakdown._sum.fileSize || 0) / storageBreakdown._count.id 
          : 0,
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt,
        user: activity.user,
      })),
      trends: Object.values(trends).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    };

    return NextResponse.json(toSerializable(analytics));
  } catch (error) {
    console.error('Error fetching organization analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
