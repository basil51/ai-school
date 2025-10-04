import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const subjectId = formData.get("subjectId") as string;
    const topicId = formData.get("topicId") as string;
    const difficulty = formData.get("difficulty") as string;
    const learningStyle = formData.get("learningStyle") as string;
    const estimatedTime = formData.get("estimatedTime") as string;

    if (!file || !title || !subjectId || !topicId) {
      return NextResponse.json(
        { error: "File, title, subject, and topic are required" },
        { status: 400 }
      );
    }

    // Check if user has permission to create curriculum
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

    // For now, only handle text files
    if (!file.type.includes("text")) {
      return NextResponse.json(
        { error: "Only text files are supported for now" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const organizationId = user.organizationId;

    // Step 1: Verify Subject exists and belongs to user's organization
    const subjectRecord = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        organizationId: organizationId,
        isActive: true
      }
    });

    if (!subjectRecord) {
      return NextResponse.json(
        { error: "Subject not found or access denied" },
        { status: 404 }
      );
    }

    // Step 2: Verify Topic exists and belongs to the subject
    const topicRecord = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subjectId: subjectRecord.id,
        isActive: true
      }
    });

    if (!topicRecord) {
      return NextResponse.json(
        { error: "Topic not found or access denied" },
        { status: 404 }
      );
    }

    // Step 3: Check if lesson already exists
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        topicId: topicRecord.id,
        title: title
      }
    });

    if (existingLesson) {
      return NextResponse.json(
        { error: `A lesson with the title "${title}" already exists in this topic. Please choose a different title.` },
        { status: 409 }
      );
    }

    // Step 4: Create the lesson
    const lastLesson = await prisma.lesson.findFirst({
      where: { topicId: topicRecord.id },
      orderBy: { order: 'desc' }
    });
    const nextLessonOrder = (lastLesson?.order || 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        objectives: [`Learn about ${title}`],
        difficulty: difficulty as any || "beginner",
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : 30,
        order: nextLessonOrder,
        topicId: topicRecord.id,
        isActive: true
      }
    });

    // Step 5: Also create a RAG document for search functionality
    const ragDocument = await prisma.ragDocument.create({
      data: {
        title,
        content,
        length: content.length,
        subject: subjectRecord.name,
        topic: topicRecord.name,
        difficulty: difficulty,
        learningStyle: learningStyle,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        organizationId: organizationId
      }
    });

    console.log('✅ [DEBUG] Lesson created successfully:', {
      lessonId: lesson.id,
      title: lesson.title,
      subject: subjectRecord.name,
      topic: topicRecord.name,
      organizationId: organizationId
    });

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        subject: subjectRecord.name,
        topic: topicRecord.name,
        difficulty: lesson.difficulty,
        estimatedTime: lesson.estimatedTime,
      },
      ragDocument: {
        id: ragDocument.id,
        title: ragDocument.title,
      },
      message: "Lesson and RAG document created successfully"
    });

  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    );
  }
}