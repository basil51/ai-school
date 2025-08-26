import { NextRequest } from "next/server";
import { embedQuery } from "@/lib/rag/embed";
import { searchByEmbedding } from "@/lib/rag/query";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question, k = 5 } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "question required" }), 
        { status: 400 }
      );
    }

    // Generate embedding for the question
    const embedding = await embedQuery(question);
    
    // Search for relevant chunks
    const context = await searchByEmbedding(embedding, k);
    
    // Create context block with citations
    const contextBlock = context
      .map((s, i) => `[[${i + 1}]] ${s.content}`)
      .join("\n\n");

    const system = `You are a precise, student-friendly teacher. Answer ONLY using the provided context. If context is insufficient, say you don't know. Cite sources inline like [1], [2].`;

    const user = `Question: ${question}

Context:
${contextBlock}`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system,
      temperature: 0.2,
      messages: [{ role: "user", content: user }],
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error("Streaming chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process streaming chat" }), 
      { status: 500 }
    );
  }
}
