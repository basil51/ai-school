import { NextRequest, NextResponse } from "next/server";
import { getIngestQueue } from "@/lib/queues/rag.queue";

export async function POST(req: NextRequest) {
  try {
    const { docId, rawText } = await req.json();

    if (!docId || !rawText) {
      return NextResponse.json(
        { error: "docId and rawText are required" },
        { status: 400 }
      );
    }

    const queue = getIngestQueue();
    const job = await queue.add(
      "ingest",
      { docId, rawText },
      { removeOnComplete: true, removeOnFail: false }
    );

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error("Enqueue error:", error);
    return NextResponse.json(
      { error: "Failed to enqueue job" },
      { status: 500 }
    );
  }
}
