import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { docId, rawText } = await request.json();

    if (!docId || !rawText) {
      return NextResponse.json(
        { error: "docId and rawText are required" },
        { status: 400 }
      );
    }

    // Get the document
    const document = await prisma.ragDocument.findUnique({
      where: { id: docId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Chunk the text
    const chunks = chunkText(rawText);
    
    // Generate embeddings for all chunks
    const embeddings = await embedTexts(chunks.map(chunk => chunk.text));

    // Store chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];
      const vectorLiteral = `[${embedding.join(",")}]`;

      const createdChunk = await prisma.ragChunk.create({
        data: {
          docId,
          content: chunk.text,
        },
      });

      // Update with embedding
      await prisma.$executeRawUnsafe(
        'UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2',
        vectorLiteral,
        createdChunk.id
      );
    }

    return NextResponse.json({
      success: true,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest document" },
      { status: 500 }
    );
  }
}
