import { NextRequest, NextResponse } from "next/server";
import { Queue, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379");
const queue = new Queue("rag_ingest", { connection });

export async function GET(req: NextRequest) {
  try {
    const jobId = req.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId required" },
        { status: 400 }
      );
    }

    const job = await Job.fromId(queue, jobId);

    if (!job) {
      return NextResponse.json({ status: "not_found" });
    }

    const state = await job.getState();
    const progress = job.progress as number | object;
    const returnvalue = job.returnvalue as any;

    return NextResponse.json({
      state,
      progress,
      result: returnvalue ?? null,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check job status" },
      { status: 500 }
    );
  }
}
