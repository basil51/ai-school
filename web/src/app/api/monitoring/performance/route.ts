import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const RecordPerformanceSchema = z.object({
  metricName: z.string().min(1).max(100),
  metricValue: z.number(),
  unit: z.string().min(1).max(20),
  context: z.record(z.string(), z.any()).optional(),
  severity: z.enum(['info', 'warning', 'error', 'critical']).default('info'),
});

// GET /api/monitoring/performance - Get performance metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can view performance metrics
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metricName');
    const severity = searchParams.get('severity');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    const where: any = {};
    if (metricName) where.metricName = metricName;
    if (severity) where.severity = severity;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const metrics = await prisma.systemPerformance.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    // Group metrics by name for summary
    const summary = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricName]) {
        acc[metric.metricName] = {
          count: 0,
          sum: 0,
          min: Infinity,
          max: -Infinity,
          latest: null,
          severity: metric.severity
        };
      }
      
      acc[metric.metricName].count++;
      acc[metric.metricName].sum += metric.metricValue;
      acc[metric.metricName].min = Math.min(acc[metric.metricName].min, metric.metricValue);
      acc[metric.metricName].max = Math.max(acc[metric.metricName].max, metric.metricValue);
      acc[metric.metricName].latest = metric.timestamp;
      
      return acc;
    }, {} as any);

    // Calculate averages
    Object.keys(summary).forEach(metricName => {
      summary[metricName].average = summary[metricName].sum / summary[metricName].count;
    });

    return NextResponse.json({
      metrics,
      summary,
      total: metrics.length
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/monitoring/performance - Record performance metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can record performance metrics
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = RecordPerformanceSchema.parse(body);

    const performance = await prisma.systemPerformance.create({
      data: {
        metricName: validatedData.metricName,
        metricValue: validatedData.metricValue,
        unit: validatedData.unit,
        context: validatedData.context,
        severity: validatedData.severity
      }
    });

    return NextResponse.json(performance, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error recording performance metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/monitoring/performance/health - Get system health status
export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and super_admins can check system health
    if (!['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recent metrics (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentMetrics = await prisma.systemPerformance.findMany({
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate health status
    const healthStatus = {
      overall: 'healthy',
      timestamp: new Date(),
      metrics: {} as any,
      alerts: [] as any[]
    };

    // Check for critical issues
    const criticalIssues = recentMetrics.filter(m => m.severity === 'critical');
    const errorIssues = recentMetrics.filter(m => m.severity === 'error');
    const warningIssues = recentMetrics.filter(m => m.severity === 'warning');

    if (criticalIssues.length > 0) {
      healthStatus.overall = 'critical';
      healthStatus.alerts.push({
        type: 'critical',
        count: criticalIssues.length,
        message: `${criticalIssues.length} critical issues detected`
      });
    } else if (errorIssues.length > 0) {
      healthStatus.overall = 'error';
      healthStatus.alerts.push({
        type: 'error',
        count: errorIssues.length,
        message: `${errorIssues.length} errors detected`
      });
    } else if (warningIssues.length > 0) {
      healthStatus.overall = 'warning';
      healthStatus.alerts.push({
        type: 'warning',
        count: warningIssues.length,
        message: `${warningIssues.length} warnings detected`
      });
    }

    // Group metrics by name and calculate status
    const metricsByName = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.metricName]) {
        acc[metric.metricName] = [];
      }
      acc[metric.metricName].push(metric);
      return acc;
    }, {} as any);

    Object.keys(metricsByName).forEach(metricName => {
      const metrics = metricsByName[metricName];
      const latest = metrics[0];
      const average = metrics.reduce((sum: number, m: any) => sum + m.metricValue, 0) / metrics.length;
      
      healthStatus.metrics[metricName] = {
        latest: latest.metricValue,
        average: average,
        unit: latest.unit,
        severity: latest.severity,
        timestamp: latest.timestamp,
        count: metrics.length
      };
    });

    return NextResponse.json(healthStatus);
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
