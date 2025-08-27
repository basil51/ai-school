export interface Chunk {
  text: string;
  start: number;
  end: number;
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Chunk[] {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    console.warn('chunkText: Invalid text input', { text: typeof text, length: text?.length });
    return [];
  }
  
  if (text.length === 0) {
    return [];
  }

  // Ensure chunkSize and overlap are positive
  chunkSize = Math.max(1, chunkSize);
  overlap = Math.max(0, Math.min(overlap, chunkSize - 1));

  const chunks: Chunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    
    // Only add non-empty chunks
    if (chunkText.trim().length > 0) {
      chunks.push({
        text: chunkText,
        start,
        end,
      });
    }

    // Calculate next start position with overlap
    const nextStart = end - overlap;
    
    // Ensure we always move forward
    if (nextStart <= start) {
      start = end;
    } else {
      start = nextStart;
    }
    
    // If we've reached the end, break
    if (start >= text.length) break;
  }

  console.log(`chunkText: Created ${chunks.length} chunks from text of length ${text.length}`);
  return chunks;
}
