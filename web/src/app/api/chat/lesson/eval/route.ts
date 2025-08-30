import { NextRequest } from "next/server";
import { embedQuery } from "@/lib/rag/embed";
import { searchHybrid } from "@/lib/rag/query";
import { adaptiveThresholding } from "@/lib/rag/threshold";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { question, k = 6, alpha = 0.5 } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "question required" }), 
        { status: 400 }
      );
    }

    // Generate embedding for the question
    const embedding = await embedQuery(question);
    
    // Search for relevant chunks using hybrid search
    const rawContext = await searchHybrid(embedding, question, k * 2, alpha); // Get more results for filtering
    
    // Apply thresholding and re-ranking
    const context = adaptiveThresholding(rawContext).slice(0, k);
    
    // Create context block with citations
    const contextBlock = context
      .map((s, i) => `[[${i + 1}]] ${s.content}`)
      .join("\n\n");

    const system = `You are a precise, student-friendly teacher. Answer ONLY using the provided context. If context is insufficient, say you don't know. Cite sources inline like [1], [2].`;

    const user = `Question: ${question}

Context:
${contextBlock}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const answer = response.choices[0]?.message?.content ?? "";
    
    return new Response(
      JSON.stringify({ 
        answer, 
        contexts: context.map(c => c.content),
        citations: context.map((_, i) => i + 1),
        strategy: "hybrid"
      }), 
      { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Evaluation chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process evaluation chat" }), 
      { status: 500 }
    );
  }
}
