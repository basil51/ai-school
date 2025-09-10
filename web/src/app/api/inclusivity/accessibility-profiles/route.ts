import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const AccessibilityProfileSchema = z.object({
  // Learning Preferences
  hasADHD: z.boolean().default(false),
  hasDyslexia: z.boolean().default(false),
  hasAutism: z.boolean().default(false),
  hasHearingImpairment: z.boolean().default(false),
  hasVisualImpairment: z.boolean().default(false),
  hasMobilityImpairment: z.boolean().default(false),
  isESL: z.boolean().default(false),
  
  // Pacing Preferences
  preferredPacing: z.enum(['very_slow', 'slow', 'standard', 'fast', 'very_fast']).default('standard'),
  breakFrequency: z.number().min(5).max(60).default(15),
  maxSessionLength: z.number().min(15).max(180).default(45),
  
  // Visual Preferences
  preferredFontSize: z.enum(['small', 'medium', 'large', 'extra_large']).default('medium'),
  preferredColorScheme: z.enum(['standard', 'high_contrast', 'dark_mode', 'light_mode', 'colorblind_friendly']).default('standard'),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  
  // Content Preferences
  simplifiedLanguage: z.boolean().default(false),
  extraExplanations: z.boolean().default(false),
  visualAids: z.boolean().default(true),
  audioSupport: z.boolean().default(true),
  
  // Cultural Preferences
  primaryLanguage: z.string().default('en'),
  culturalContext: z.string().optional(),
  religiousConsiderations: z.string().optional(),
});

// GET /api/inclusivity/accessibility-profiles - Get accessibility profiles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    } else {
      // If no specific user, return current user's profile
      where.userId = session.user.id;
    }
    
    if (organizationId) {
      where.organizationId = organizationId;
    } else {
      // For now, we'll get the user's organization from the database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
      });
      if (user?.organizationId) {
        where.organizationId = user.organizationId;
      }
    }

    const profiles = await prisma.userAccessibilityProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching accessibility profiles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/inclusivity/accessibility-profiles - Create or update accessibility profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = AccessibilityProfileSchema.parse(body);

    // Check if profile already exists
    const existingProfile = await prisma.userAccessibilityProfile.findUnique({
      where: { userId: session.user.id }
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      profile = await prisma.userAccessibilityProfile.update({
        where: { userId: session.user.id },
        data: {
          ...validatedData,
          organizationId: (await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { organizationId: true }
          }))?.organizationId || '',
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          organization: {
            select: { id: true, name: true }
          }
        }
      });
    } else {
      // Create new profile
      profile = await prisma.userAccessibilityProfile.create({
      data: {
        userId: session.user.id,
        organizationId: (await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { organizationId: true }
        }))?.organizationId || '',
        ...validatedData,
      },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          },
          organization: {
            select: { id: true, name: true }
          }
        }
      });
    }

    return NextResponse.json(profile, { status: existingProfile ? 200 : 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error creating/updating accessibility profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/inclusivity/accessibility-profiles - Update accessibility profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...profileData } = body;

    // Users can only update their own profile, admins can update any profile
    const targetUserId = userId || session.user.id;
    
    if (targetUserId !== session.user.id && !['admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validatedData = AccessibilityProfileSchema.partial().parse(profileData);

    const profile = await prisma.userAccessibilityProfile.upsert({
      where: { userId: targetUserId },
      update: validatedData,
      create: {
        userId: targetUserId,
        organizationId: (await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { organizationId: true }
        }))?.organizationId || '',
        ...validatedData,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Error updating accessibility profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
