import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        emailPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update email preferences to disable weekly progress emails
    await prisma.emailPreference.upsert({
      where: { userId: user.id },
      update: {
        weeklyProgressEnabled: false,
      },
      create: {
        userId: user.id,
        weeklyProgressEnabled: false,
        emailFrequency: 'never',
      },
    });

    // Redirect to a success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/unsubscribe-success?email=${encodeURIComponent(email)}`
    );
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, enabled } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update email preferences
    await prisma.emailPreference.upsert({
      where: { userId: user.id },
      update: {
        weeklyProgressEnabled: enabled !== undefined ? enabled : true,
      },
      create: {
        userId: user.id,
        weeklyProgressEnabled: enabled !== undefined ? enabled : true,
        emailFrequency: 'weekly',
      },
    });

    return NextResponse.json({
      message: 'Email preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
