import { NextRequest, NextResponse } from "next/server";
import { embedQuery } from "@/lib/rag/embed";
import { searchByEmbedding } from "@/lib/rag/query";

export async function POST(request: NextRequest) {
  try {
    const { query, k = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const embedding = await embedQuery(query);
    
    // Search for similar chunks
    const results = await searchByEmbedding(embedding, Math.min(k, 20));

    return NextResponse.json({
      query,
      snippets: results,
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
