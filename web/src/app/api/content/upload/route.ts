import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const topic = formData.get("topic") as string;
    const difficulty = formData.get("difficulty") as string;
    const learningStyle = formData.get("learningStyle") as string;
    const estimatedTime = formData.get("estimatedTime") as string;

    if (!file || !title || !subject || !topic) {
      return NextResponse.json(
        { error: "File, title, subject, and topic are required" },
        { status: 400 }
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
    const length = content.length;

    const document = await prisma.ragDocument.create({
      data: {
        title,
        content,
        length,
        subject: subject || null,
        topic: topic || null,
        difficulty: difficulty || null,
        learningStyle: learningStyle || null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
      },
    });

    return NextResponse.json({
      docId: document.id,
      title: document.title,
      subject: document.subject,
      topic: document.topic,
      difficulty: document.difficulty,
      learningStyle: document.learningStyle,
      estimatedTime: document.estimatedTime,
      chars: document.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
