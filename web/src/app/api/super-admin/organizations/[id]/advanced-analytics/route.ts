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
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 30;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        users: true,
        documents: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate user engagement metrics
    const totalUsers = organization.users.length;
    const activeUsers = organization.users.filter(user => {
      // Consider users active if they have recent activity (created within last 30 days)
      return new Date(user.createdAt) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }).length;

    // Calculate content analytics
    const totalDocuments = organization.documents.length;
    const documentsUploaded = organization.documents.filter(doc => 
      new Date(doc.createdAt) >= startDate
    ).length;
    const averageDocumentSize = totalDocuments > 0 
      ? organization.documents.reduce((sum: number, doc: any) => sum + Number(doc.length || 0), 0) / totalDocuments 
      : 0;

    // Get document type distribution
    const documentTypes = organization.documents.reduce((acc: Record<string, number>, doc: any) => {
      const type = doc.title?.split('.').pop()?.toUpperCase() || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularDocumentTypes = Object.entries(documentTypes)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalDocuments) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate interaction metrics (simulated for now)
    const totalQuestions = organization.monthlyQuestions || 0;
    const questionsPerUser = totalUsers > 0 ? totalQuestions / totalUsers : 0;
    const satisfactionScore = 4.6; // Simulated
    const averageResponseTime = 1.2; // Simulated

    // Simulate question categories
    const questionCategories = [
      { category: 'Mathematics', count: Math.floor(totalQuestions * 0.33), percentage: 33.3 },
      { category: 'Science', count: Math.floor(totalQuestions * 0.26), percentage: 25.7 },
      { category: 'History', count: Math.floor(totalQuestions * 0.16), percentage: 15.7 },
      { category: 'Literature', count: Math.floor(totalQuestions * 0.12), percentage: 12 },
      { category: 'Other', count: Math.floor(totalQuestions * 0.13), percentage: 13.3 },
    ];

    // Performance metrics (simulated)
    const systemUptime = 99.8;
    const errorRate = 0.2;

    // Generate peak usage times (simulated)
    const peakUsageTimes = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      requests: Math.floor(Math.random() * 500) + 100,
    }));

    // Device analytics (simulated)
    const deviceAnalytics = {
      desktop: 65,
      mobile: 25,
      tablet: 10,
      browserUsage: [
        { browser: 'Chrome', users: Math.floor(totalUsers * 0.45), percentage: 45.4 },
        { browser: 'Safari', users: Math.floor(totalUsers * 0.19), percentage: 18.7 },
        { browser: 'Firefox', users: Math.floor(totalUsers * 0.15), percentage: 15.1 },
        { browser: 'Edge', users: Math.floor(totalUsers * 0.13), percentage: 12.5 },
        { browser: 'Other', users: Math.floor(totalUsers * 0.08), percentage: 8.3 },
      ],
    };

    // Generate trends data
    const trends = Array.from({ length: daysAgo }, (_, i) => {
      const date = new Date(now.getTime() - (daysAgo - 1 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        users: Math.floor(totalUsers * (0.8 + Math.random() * 0.4)),
        documents: Math.floor(totalDocuments * (0.8 + Math.random() * 0.4)),
        questions: Math.floor(totalQuestions * (0.8 + Math.random() * 0.4)),
        storage: Math.floor(averageDocumentSize * totalDocuments * (0.8 + Math.random() * 0.4)),
        errors: Math.floor(Math.random() * 5),
      };
    });

    // Calculate user engagement metrics
    const newUsers = organization.users.filter(user => 
      new Date(user.createdAt) >= startDate
    ).length;
    const returningUsers = activeUsers - newUsers;
    const averageSessionDuration = 23.5; // Simulated
    const bounceRate = 12.3; // Simulated
    const userRetention = Math.round((returningUsers / totalUsers) * 100);

    const advancedAnalytics = {
      organizationId,
      timeRange,
      userEngagement: {
        totalUsers,
        activeUsers,
        newUsers,
        returningUsers,
        averageSessionDuration,
        bounceRate,
        userRetention,
      },
      contentAnalytics: {
        totalDocuments,
        documentsUploaded,
        documentsProcessed: totalDocuments,
        averageDocumentSize,
        popularDocumentTypes,
      },
      interactionMetrics: {
        totalQuestions,
        questionsPerUser,
        averageResponseTime,
        satisfactionScore,
        questionCategories,
      },
      performanceMetrics: {
        systemUptime,
        averageResponseTime,
        errorRate,
        peakUsageTimes,
      },
      deviceAnalytics,
      trends,
    };

    return NextResponse.json(toSerializable(advancedAnalytics));
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
