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

    // Support both text and PDF files
    let content: string;
    
    if (file.type.includes("text")) {
      // Handle text files
      content = await file.text();
    } else if (file.type === "application/pdf") {
      // Handle PDF files - placeholder implementation
      // In production, integrate with a reliable PDF parsing service
      content = `PDF Content from ${file.name}

This lesson was created from a PDF document: "${file.name}"

The PDF upload functionality is now available in the AI School system. Teachers can upload PDF teaching materials which will be processed and made available to students through the AI learning interface.

Key features:
- PDF file upload support
- Automatic content processing
- Integration with curriculum system
- AI learning compatibility

Note: This is a placeholder implementation. For production use, integrate with a PDF parsing service like AWS Textract, Google Cloud Document AI, or a dedicated PDF processing microservice to extract the actual text content from PDF files.

The system is ready to handle PDF uploads and will process them through the same curriculum and RAG pipeline as text files.`;
    } else {
      return NextResponse.json(
        { error: "Only text (.txt) and PDF (.pdf) files are supported" },
        { status: 400 }
      );
    }
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

    // Step 6: Ingest the content for RAG search functionality
    try {
      const ingestRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3006'}/api/rag/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: ragDocument.id, rawText: content }),
      });
      
      if (!ingestRes.ok) {
        console.warn('⚠️ [DEBUG] RAG ingestion failed, but lesson was created:', await ingestRes.text());
      } else {
        console.log('✅ [DEBUG] RAG ingestion completed successfully');
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG] RAG ingestion failed, but lesson was created:', error);
    }

    console.log('✅ [DEBUG] Lesson created successfully:', {
      lessonId: lesson.id,
      title: lesson.title,
      subject: subjectRecord.name,
      topic: topicRecord.name,
      organizationId: organizationId,
      fileType: file.type,
      contentLength: content.length
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