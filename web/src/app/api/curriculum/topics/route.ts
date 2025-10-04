import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subjectId, name, description } = await req.json();

    if (!subjectId || !name) {
      return NextResponse.json(
        { error: "Subject ID and topic name are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: token.sub },
      include: { organization: true }
    });

    if (!user || (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if subject exists and belongs to user's organization
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        organizationId: user.organizationId,
        isActive: true
      }
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    // Check if topic already exists
    const existingTopic = await prisma.topic.findFirst({
      where: {
        name: name,
        subjectId: subjectId,
        isActive: true
      }
    });

    if (existingTopic) {
      return NextResponse.json(
        { error: "Topic already exists" },
        { status: 409 }
      );
    }

    // Get the next order number for this subject
    const lastTopic = await prisma.topic.findFirst({
      where: { subjectId: subjectId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = (lastTopic?.order || 0) + 1;

    // Create the topic
    const topic = await prisma.topic.create({
      data: {
        name,
        description: description || `Topic: ${name}`,
        order: nextOrder,
        subjectId: subjectId,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        order: topic.order,
        subjectId: topic.subjectId
      }
    });

  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
