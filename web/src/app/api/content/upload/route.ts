import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
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
      },
    });

    return NextResponse.json({
      docId: document.id,
      title: document.title,
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
