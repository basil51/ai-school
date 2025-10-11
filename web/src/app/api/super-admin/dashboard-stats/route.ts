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

    // Get current date for calculations
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total counts
    const [
      totalOrganizations,
      totalUsers,
      activeSessions,
      activeOrganizations,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      // Count active sessions (sessions that haven't expired)
      prisma.session.count({
        where: {
          expires: {
            gt: now,
          },
        },
      }),
      prisma.organization.count({
        where: { isActive: true },
      }),
    ]);

    // Get growth statistics
    const [
      newOrganizationsThisMonth,
      newUsersThisWeek,
    ] = await Promise.all([
      prisma.organization.count({
        where: {
          createdAt: {
            gte: oneMonthAgo,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
    ]);

    // Calculate system health based on active organizations vs total
    const systemHealthPercentage = totalOrganizations > 0 
      ? Math.round((activeOrganizations / totalOrganizations) * 100 * 10) / 10
      : 100;

    // Get system health status
    let systemHealthStatus = 'Excellent';
    if (systemHealthPercentage < 95) {
      systemHealthStatus = 'Good';
    } else if (systemHealthPercentage < 90) {
      systemHealthStatus = 'Fair';
    } else if (systemHealthPercentage < 80) {
      systemHealthStatus = 'Poor';
    }

    const dashboardStats = {
      totalOrganizations: {
        value: totalOrganizations.toString(),
        change: `+${newOrganizationsThisMonth} this month`,
        trend: newOrganizationsThisMonth > 0 ? 'up' : 'stable'
      },
      totalUsers: {
        value: totalUsers.toLocaleString(),
        change: `+${newUsersThisWeek} this week`,
        trend: newUsersThisWeek > 0 ? 'up' : 'stable'
      },
      activeSessions: {
        value: activeSessions.toString(),
        change: `${activeSessions} active now`,
        trend: activeSessions > 0 ? 'up' : 'stable'
      },
      systemHealth: {
        value: `${systemHealthPercentage}%`,
        change: systemHealthStatus,
        trend: systemHealthPercentage >= 95 ? 'excellent' : systemHealthPercentage >= 90 ? 'good' : 'fair'
      }
    };

    return NextResponse.json(toSerializable(dashboardStats));
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
