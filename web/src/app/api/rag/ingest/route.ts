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

    // Get the document using raw SQL
    const document = await prisma.$queryRaw`SELECT id FROM "RagDocument" WHERE id = ${docId}`;

    if (!Array.isArray(document) || document.length === 0) {
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

      // Create chunk and update with embedding using raw SQL
      const result = await prisma.$queryRaw`
        INSERT INTO "RagChunk" ("docId", "content", "createdAt") 
        VALUES (${docId}, ${chunk.text}, NOW()) 
        RETURNING id
      `;
      
      const chunkId = (result as { id: string }[])[0].id;
      
      // Update with embedding
      await prisma.$executeRawUnsafe(
        'UPDATE "RagChunk" SET embedding = $1::vector WHERE id = $2',
        vectorLiteral,
        chunkId
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
