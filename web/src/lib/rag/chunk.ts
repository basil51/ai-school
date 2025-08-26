export interface Chunk {
  text: string;
  start: number;
  end: number;
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    
    chunks.push({
      text: chunkText,
      start,
      end,
    });

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}
