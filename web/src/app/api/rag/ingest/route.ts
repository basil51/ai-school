import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
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

    // Validate rawText
    if (!rawText || typeof rawText !== 'string') {
      console.error('Invalid rawText:', { type: typeof rawText, length: rawText?.length });
      return NextResponse.json(
        { error: "Invalid text content" },
        { status: 400 }
      );
    }

    console.log(`Ingesting document ${docId} with text length: ${rawText.length}`);

    // Chunk the text
    const chunks = chunkText(rawText);
    
    if (chunks.length === 0) {
      console.warn('No chunks created from text');
      return NextResponse.json(
        { error: "No valid chunks created from text" },
        { status: 400 }
      );
    }

    console.log(`Created ${chunks.length} chunks, generating embeddings...`);
    
    // Generate embeddings for all chunks
    const embeddings = await embedTexts(chunks.map(chunk => chunk.text));

    // Store chunks with embeddings using batch insert for better performance
    const chunkData = chunks.map((chunk, i) => {
      const embedding = embeddings[i];
      const vectorLiteral = `[${embedding.join(",")}]`;
      
      return {
        id: randomUUID(),
        docId,
        content: chunk.text,
        embedding: vectorLiteral
      };
    });

    // Basic validation: ensure embedding dimensions are consistent (1536 for text-embedding-3-small)
    const invalid = embeddings.find((e) => !Array.isArray(e) || e.length !== 1536);
    if (invalid) {
      console.error('Embedding dimension mismatch', { length: invalid?.length });
      return NextResponse.json(
        { error: "Embedding dimension mismatch. Expected 1536." },
        { status: 500 }
      );
    }

    // Use raw SQL with proper ID generation
    for (const data of chunkData) {
      await prisma.$executeRaw`
        INSERT INTO "RagChunk" ("id", "docId", "content", "embedding") 
        VALUES (${data.id}, ${data.docId}, ${data.content}, ${data.embedding}::vector)
      `;
    }

    return NextResponse.json({
      success: true,
      chunksCreated: chunks.length,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    const message = (error as any)?.message ?? 'Failed to ingest document';
    const code = (error as any)?.code;
    return NextResponse.json(
      { error: message, code },
      { status: 500 }
    );
  }
}
