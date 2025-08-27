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
    const t0 = performance.now();
    const embedding = await embedQuery(query);
    const t1 = performance.now();
    
    // Search
    const t2 = performance.now();
    const results = mode === "vector"
      ? await searchByEmbedding(embedding, Math.min(k, 20))
      : await searchHybrid(embedding, query, Math.min(k, 20), alpha);
    const t3 = performance.now();

    return NextResponse.json({
      query,
      snippets: results,
      timings: {
        embedMs: Math.round(t1 - t0),
        searchMs: Math.round(t3 - t2),
        totalMs: Math.round(t3 - t0),
        mode,
      },
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 }
    );
  }
}
