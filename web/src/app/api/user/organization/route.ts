import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserWithOrganization } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserWithOrganization();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // For super_admin users, they might not have an organization
    if (!user.organization && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "User not associated with any organization" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organization: user.organization,
      userRole: user.role,
    });
  } catch (error) {
    console.error("Error fetching user organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
