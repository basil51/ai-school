import { NextRequest, NextResponse } from "next/server";
import { embedQuery } from "@/lib/rag/embed";
import { searchByEmbedding, searchHybrid } from "@/lib/rag/query";

export async function POST(request: NextRequest) {
  try {
    const { query, k = 5, mode = "hybrid", alpha = 0.5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const embedding = await embedQuery(query);
    
    // Search
    const results = mode === "vector"
      ? await searchByEmbedding(embedding, Math.min(k, 20))
      : await searchHybrid(embedding, query, Math.min(k, 20), alpha);

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
