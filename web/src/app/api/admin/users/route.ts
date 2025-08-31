import { NextRequest, NextResponse } from "next/server";
//import { getServerSession } from "next-auth";
//import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "argon2";
import { getOrganizationContext, withOrganizationFilter, logAuditActivity, checkOrganizationLimits } from "@/lib/organization";
import { toSerializable } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const context = await getOrganizationContext();
    
    if (!context || (!context.isOrgAdmin && !context.isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if organizationId is provided in query params (for super admin organization switching)
    const { searchParams } = new URL(request.url);
    const queryOrgId = searchParams.get('organizationId');
    
    let organizationFilter;
    if (queryOrgId && context.isSuperAdmin) {
      // Super admin is viewing a specific organization
      organizationFilter = { organizationId: queryOrgId };
    } else {
      // Use normal organization context
      organizationFilter = withOrganizationFilter(context.organizationId, context.isSuperAdmin);
    }

    const users = await prisma.user.findMany({
      where: organizationFilter,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(toSerializable(users));
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getOrganizationContext();
    
    if (!context || (!context.isOrgAdmin && !context.isSuperAdmin)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, name, role, organizationId } = await req.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Email, name, and role are required" }, { status: 400 });
    }

    // Determine target organization
    let targetOrgId = organizationId;
    if (!context.isSuperAdmin) {
      // Non-super admins can only create users in their own organization
      targetOrgId = context.organizationId;
    }

    // Check organization limits
    if (targetOrgId) {
      const limits = await checkOrganizationLimits(targetOrgId);
      if (!limits.withinLimits && limits.errors.includes('Maximum user limit reached')) {
        return NextResponse.json({ error: "Organization user limit reached" }, { status: 403 });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Validate role hierarchy
    if (!context.isSuperAdmin && role === 'super_admin') {
      return NextResponse.json({ error: "Cannot create super admin users" }, { status: 403 });
    }

    if (!context.isSuperAdmin && !context.isOrgAdmin && ['admin', 'teacher'].includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions to create admin or teacher users" }, { status: 403 });
    }

    // Create user with a default password (they can change it later)
    const hashedPassword = await hash("changeme123");
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        organizationId: targetOrgId,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    // Log audit activity
    await logAuditActivity(
      targetOrgId,
      context.userId,
      'user_created',
      'user',
      user.id,
      { email, name, role },
      req
    );

    return NextResponse.json(toSerializable(user));
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
