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

export interface LexicalResult {
  id: string;
  content: string;
  docId: string;
  ts_rank: number;
}

export async function searchLexical(
  query: string,
  limit: number = 5
): Promise<LexicalResult[]> {
  // Simple full-text search using english dictionary
  const results = await prisma.$queryRaw<LexicalResult[]>`
    SELECT 
      "id",
      "content",
      "docId",
      ts_rank_cd(to_tsvector('english', "content"), plainto_tsquery('english', ${query})) as ts_rank
    FROM "RagChunk"
    WHERE to_tsvector('english', "content") @@ plainto_tsquery('english', ${query})
    ORDER BY ts_rank DESC
    LIMIT ${limit}
  `;
  return results;
}

export interface HybridResult extends SearchResult {
  lexicalRank?: number;
  score: number;
}

export async function searchHybrid(
  embedding: number[],
  query: string,
  limit: number = 5,
  alpha: number = 0.5 // weight for vector similarity (0..1)
): Promise<HybridResult[]> {
  const [vec, lex] = await Promise.all([
    searchByEmbedding(embedding, limit),
    searchLexical(query, limit),
  ]);

  // Build maps for quick lookup
  const vecMap = new Map(vec.map((r) => [r.id, r.similarity]));
  const lexMap = new Map(lex.map((r) => [r.id, r.ts_rank]));

  // Collect unique ids from both sets
  const ids = Array.from(new Set([...vec.map((r) => r.id), ...lex.map((r) => r.id)]));

  // Normalization helpers
  const vecVals = vec.map((r) => r.similarity);
  const lexVals = lex.map((r) => r.ts_rank);
  const norm = (v: number, min: number, max: number) => (max > min ? (v - min) / (max - min) : 0);
  const vecMin = Math.min(...vecVals, 1, 0);
  const vecMax = Math.max(...vecVals, 1, 0);
  const lexMin = Math.min(...lexVals, 0);
  const lexMax = Math.max(...lexVals, 0);

  // Merge and score
  const merged: HybridResult[] = ids.map((id) => {
    const vSim = vecMap.get(id) ?? 0;
    const lRank = lexMap.get(id) ?? 0;
    const vNorm = norm(vSim, vecMin, vecMax);
    const lNorm = norm(lRank, lexMin, lexMax);
    const score = alpha * vNorm + (1 - alpha) * lNorm;
    const any = (vec.find((r) => r.id === id) as SearchResult | undefined) || (lex.find((r) => r.id === id) as any);
    return {
      id,
      content: any?.content ?? "",
      docId: any?.docId ?? "",
      similarity: vSim,
      lexicalRank: lRank,
      score,
    };
  });

  merged.sort((a, b) => b.score - a.score);
  return merged.slice(0, limit);
}
