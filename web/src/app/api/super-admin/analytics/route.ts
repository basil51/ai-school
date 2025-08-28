import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toSerializable } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if ((session as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get total counts
    const [
      totalOrganizations,
      totalUsers,
      totalDocuments,
      totalQuestions,
      totalStorage,
      activeOrganizations,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.ragDocument.count(),
      prisma.organization.aggregate({
        _sum: {
          monthlyQuestions: true,
        },
      }),
      prisma.ragDocument.aggregate({
        _sum: {
          length: true,
        },
      }),
      prisma.organization.count({
        where: { isActive: true },
      }),
    ]);

    // Get tier distribution
    const tierDistribution = await prisma.organization.groupBy({
      by: ['tier'],
      _count: {
        tier: true,
      },
    });

    const totalOrgs = totalOrganizations;
    const tierStats = tierDistribution.map(tier => ({
      tier: tier.tier,
      count: tier._count.tier,
      percentage: Math.round((tier._count.tier / totalOrgs) * 100),
    }));

    // Get top organizations by activity
    const topOrganizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        tier: true,
        monthlyQuestions: true,
        storageUsed: true,
        _count: {
          select: {
            users: true,
            documents: true,
          },
        },
      },
      orderBy: {
        monthlyQuestions: 'desc',
      },
      take: 10,
    });

    // Get recent activity across all organizations
    const recentActivity = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get monthly growth trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await prisma.auditLog.groupBy({
      by: ['action', 'createdAt'],
      where: {
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
          newOrganizations: 0,
          newUsers: 0,
          newDocuments: 0,
          questionsAsked: 0,
        };
      }
      
      switch (item.action) {
        case 'organization_created':
          acc[month].newOrganizations += item._count.action;
          break;
        case 'user_created':
          acc[month].newUsers += item._count.action;
          break;
        case 'document_uploaded':
          acc[month].newDocuments += item._count.action;
          break;
        case 'question_asked':
          acc[month].questionsAsked += item._count.action;
          break;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const analytics = {
      totalOrganizations,
      totalUsers,
      totalDocuments,
      totalQuestions: totalQuestions._sum.monthlyQuestions || 0,
      totalStorage: Number(totalStorage._sum.length || 0),
      activeOrganizations,
      tierDistribution: tierStats,
      topOrganizations: topOrganizations.map(org => ({
        id: org.id,
        name: org.name,
        tier: org.tier,
        userCount: org._count.users,
        documentCount: org._count.documents,
        questionCount: org.monthlyQuestions,
        storageUsed: Number(org.storageUsed || 0),
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        organizationName: activity.organization?.name || 'Unknown',
        userEmail: activity.user?.email || 'Unknown',
        createdAt: activity.createdAt,
      })),
      monthlyGrowth: Object.values(trends).sort((a: any, b: any) => a.month.localeCompare(b.month)),
    };

    return NextResponse.json(toSerializable(analytics));
  } catch (error) {
    console.error('Error fetching system analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
