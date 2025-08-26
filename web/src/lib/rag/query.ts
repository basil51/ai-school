import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SearchResult {
  id: string;
  content: string;
  docId: string;
  similarity: number;
}

export async function searchByEmbedding(
  embedding: number[],
  limit: number = 5
): Promise<SearchResult[]> {
  const vectorLiteral = `[${embedding.join(",")}]`;
  
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT 
      "id",
      "content",
      "docId",
      1 - ("embedding" <=> ${vectorLiteral}::vector) as similarity
    FROM "RagChunk"
    ORDER BY "embedding" <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `;

  return results;
}
