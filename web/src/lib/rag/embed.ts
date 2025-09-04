import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function embedText(text: string): Promise<number[]> {
  if (!openai) {
    console.warn('OpenAI API key not configured, returning mock embedding');
    // Return a mock embedding for build time
    return new Array(1536).fill(0).map(() => Math.random() - 0.5);
  }
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!openai) {
    console.warn('OpenAI API key not configured, returning mock embeddings');
    // Return mock embeddings for build time
    return texts.map(() => new Array(1536).fill(0).map(() => Math.random() - 0.5));
  }
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map(item => item.embedding);
}

export async function embedQuery(query: string): Promise<number[]> {
  return embedText(query);
}
