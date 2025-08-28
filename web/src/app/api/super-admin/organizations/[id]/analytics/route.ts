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

    // Get user count for organization
    const userCount = await prisma.user.count({
      where: { organizationId },
    });

    // Get document count for organization
    const documentCount = await prisma.ragDocument.count({
      where: { organizationId },
    });

    // Calculate usage percentages
    const settings = organization.settings;
    const usagePercentages = {
      users: settings ? Math.round((userCount / settings.maxUsers) * 100) : 0,
      documents: settings ? Math.round((documentCount / settings.maxDocuments) * 100) : 0,
      questions: settings ? Math.round((organization.monthlyQuestions / settings.maxQuestionsPerMonth) * 100) : 0,
      storage: settings ? Math.round(Number((organization.storageUsed * BigInt(100)) / settings.maxStorageBytes)) : 0,
    };

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
          users: userCount,
          documents: documentCount,
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
      userStats: [
        { role: 'student', count: 0 },
        { role: 'teacher', count: 0 },
        { role: 'guardian', count: 0 },
        { role: 'admin', count: 0 },
      ],
      documentStats: [
        { status: 'processed', count: documentCount },
      ],
      storage: {
        totalSize: 0,
        documentCount: documentCount,
        averageSize: 0,
      },
      recentActivity: [],
      trends: [],
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
