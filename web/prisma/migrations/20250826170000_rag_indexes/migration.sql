-- Create IVFFLAT index for pgvector similarity search on RagChunk.embedding
-- Note: Requires pgvector extension (already enabled in init.sql)
CREATE INDEX IF NOT EXISTS "RagChunk_embedding_ivfflat_idx"
ON "public"."RagChunk"
USING ivfflat ("embedding") WITH (lists = 100);

-- Create GIN index for full-text search on RagChunk.content
-- Note: Uses english dictionary, matching query.ts usage
CREATE INDEX IF NOT EXISTS "RagChunk_content_tsv_gin_idx"
ON "public"."RagChunk"
USING GIN (to_tsvector('english', "content"));


