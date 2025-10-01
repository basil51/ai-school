In React (dev mode), StrictMode deliberately mounts/unmounts components twice to help surface side effects — that frequently leads to network calls running twice during development. Because your content generation runs as a side effect on mount/useEffect, you see the console line and a fetch twice.

Your component already tries to avoid duplicates with hasGeneratedContent.current, but that is instance-scoped and reset when React re-mounts the component during StrictMode verification, so it doesn't stop the duplicate requests across the two mount cycles. I inspected the hasGeneratedContent ref and the useEffect that calls generateSmartContent. 

EnhancedSmartLearningCanvas

 

EnhancedSmartLearningCanvas

Two practical fixes (pick one or both)

A — Fast, safe fix: add a module-scoped lock so duplicate mounts share one generation lock across re-mounts (prevents duplicate fetches in dev StrictMode)

Add near the top of EnhancedSmartLearningCanvas.tsx (module scope):

// at top of file, outside the component
const generationLocks = new Set<string>();


Then change the start of generateSmartContent to use the lock (replace the early-return check or add to it):

const generateSmartContent = useCallback(async () => {
  const lessonId = lessonData.lesson.id;

  // Global/module lock prevents duplicate network calls across remounts (React StrictMode)
  if (generationLocks.has(lessonId)) {
    console.log('Generation already in progress (global lock), skipping for', lessonId);
    return;
  }

  // local guard still useful
  if (loading || isGenerating || hasGeneratedContent.current) {
    console.log('Content generation already in progress or completed, skipping...');
    return;
  }

  // acquire lock
  generationLocks.add(lessonId);

  try {
    setLoading(true);
    setError(null);
    setIsGenerating(true);
    setGenerationProgress(0);

    console.log('Generating comprehensive content');
    const response = await fetch('/api/smart-teaching/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lessonId,
        contentType: 'full',
        learningStyle,
        forceRegenerate: false
      })
    });

    if (!response.ok) throw new Error('Failed to generate smart content');

    const data = await response.json();
    setGeneratedContent(data.data);
    // ...rest of your success handling...

    hasGeneratedContent.current = true;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  } finally {
    // release lock
    generationLocks.delete(lessonData.lesson.id);
    setLoading(false);
    setIsGenerating(false);
    setGenerationProgress(0);
  }
}, [lessonData.lesson.id, learningStyle, onContentGenerated]);


Why this works: the generationLocks Set is at module scope (shared across re-mounts of the same module in the same page session), so when StrictMode mounts the component twice the second mount will see the lock and skip the duplicate fetch.

I verified the exact console.log('Generating comprehensive content') site in your file. 

EnhancedSmartLearningCanvas

B — Design/robust fix: move fetching / caching responsibility up to the parent or make server-side idempotent

UnifiedSmartTeachingInterface already holds generatedContent state and receives onContentGenerated from the child (you can instead make the parent own the fetch). If the parent starts/owns the generation and passes the data down, you avoid duplicate generation entirely. See where EnhancedSmartLearningCanvas is instantiated in UnifiedSmartTeachingInterface.tsx. 

UnifiedSmartTeachingInterface

Or make the /api/smart-teaching/generate-content endpoint idempotent (server returns cached / same response if generation already in progress), so duplicate requests are harmless.

Extra options / notes

You can also disable StrictMode while developing to avoid the double mount behavior — not recommended as a long-term solution since StrictMode is useful. Prefer a code fix or server-side idempotency.

If you prefer a very small tweak: set a module-level cache of generated results mapped by lessonId so even if two requests get sent, the second one will be short-circuited by returning cached data. That is similar to the lock approach but caches the result.

What I recommend right now

Add the generationLocks Set and the lock/unlock code around your fetch (fast + minimal change). This prevents duplicate requests in dev and production race cases.

Optionally move generation to the parent (if you want a single source-of-truth for generated content across other UI) — UnifiedSmartTeachingInterface already has generatedContent state and a handleContentGenerated callback you can reuse. 

UnifiedSmartTeachingInterface

If you want, I can:

Produce a small patch (diff) you can paste into EnhancedSmartLearningCanvas.tsx (I already built the snippet above).

Or convert the child so the parent owns the fetch and show that diff.

Which would you like — the quick lock patch (A) or the parent-owned fetch refactor (B)?

Sources
You said:
Which is better, not fast, what I want, this is a big project, I want the best solutions
ChatGPT said:
Thought for a couple of seconds

Nice — you want the best long-term architecture for a large project. Good choice to avoid hacks. Below I’ll give a clear, production-grade design (why it’s better), concrete implementation steps, and copy-pasteable code examples for both the frontend (make the parent own generation) and the backend (make the endpoint idempotent / job-based with progress). After that I list testing, monitoring, and edge-case notes so you can roll this out safely.

Summary / why this is the best approach

Single source of truth: Parent component (e.g. UnifiedSmartTeachingInterface) owns generation state so multiple child mounts can't trigger duplicate flows. This reduces UI complexity and race-conditions.

Idempotent, job-based backend: Backend treats content-generation as a job (with idempotency keys & locks). That prevents duplicate heavy work, supports retries, and scales better.

Progress & cancelation: Use an API that supports progress updates (SSE/WebSocket or polling) and request cancellation (AbortController). UX is clearer and robust.

Caching & locks: Use Redis (or DB) lock + cached result so duplicate requests are quick and safe.

Observability: Log job status and errors; metrics make it reliable in production.

High-level architecture (components)

Frontend parent (UnifiedSmartTeachingInterface)

owns: isGenerating, generationJobId, generatedContent, generationProgress, error

triggers generation, listens for progress, cancels if needed, caches result in-memory (or via localStorage)

Child components (e.g. EnhancedSmartLearningCanvas)

presentational only: receive generatedContent, isGenerating, progress, onRegenerate, onCancel.

Backend

/generate-content (POST) returns { jobId } and starts job if not already started (idempotent)

/job-status/:jobId (GET) returns status/progress/result (fast)

optional SSE /job-events/:jobId for real-time progress push

Storage/Locking

Redis for SETNX-style lock and cached generated result (or DB row + unique constraint).

Frontend — concrete implementation
Key ideas

Parent triggers generation and stores jobId. It will not rely on child mount hooks.

Use AbortController for cancel; use polling or SSE to get progress.

Child is pure presentational.

Parent (React) — example (TypeScript / React)

Replace your existing child-owned fetch with this parent-owned implementation.

// UnifiedSmartTeachingInterface.tsx (parent)
import React, { useCallback, useEffect, useRef, useState } from "react";

type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export default function UnifiedSmartTeachingInterface({ lessonData, user }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [generatedContent, setGeneratedContent] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimer = useRef<number | null>(null);

  const startGeneration = useCallback(async (options?: { force?: boolean }) => {
    if (!lessonData?.lesson?.id) return;
    setError(null);

    // cancel any previous
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsGenerating(true);
      setGenerationProgress(0);

      // call /generate-content; supply an idempotencyKey (lessonId+user) so backend can dedupe
      const body = {
        lessonId: lessonData.lesson.id,
        userId: user?.id,
        force: !!options?.force,
        idempotencyKey: `${lessonData.lesson.id}:${user?.id}`
      };

      const resp = await fetch('/api/smart-teaching/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!resp.ok) {
        throw new Error(`Generation request failed: ${resp.status}`);
      }

      const { jobId } = await resp.json();
      setGenerationJobId(jobId);

      // now poll job status (or subscribe to SSE)
      pollJobStatus(jobId, controller);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Generation cancelled');
      } else {
        setError(err.message || 'Generation failed');
      }
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [lessonData?.lesson?.id, user?.id]);

  const pollJobStatus = useCallback((jobId: string, controller: AbortController) => {
    // clear old timers
    if (pollTimer.current) {
      window.clearInterval(pollTimer.current);
    }

    async function check() {
      try {
        const resp = await fetch(`/api/smart-teaching/job-status/${jobId}`, { signal: controller.signal });
        if (!resp.ok) throw new Error('job status failed');
        const json = await resp.json();
        // expected { status: 'running'|'completed'|'failed', progress: 0-100, result?: {...}, error?: string }
        setGenerationProgress(json.progress ?? null);

        if (json.status === 'completed') {
          setGeneratedContent(json.result);
          setIsGenerating(false);
          setGenerationJobId(null);
          if (pollTimer.current) { window.clearInterval(pollTimer.current); pollTimer.current = null; }
        } else if (json.status === 'failed' || json.status === 'cancelled') {
          setError(json.error || 'Generation failed');
          setIsGenerating(false);
          if (pollTimer.current) { window.clearInterval(pollTimer.current); pollTimer.current = null; }
        }
        // otherwise keep polling
      } catch (e: any) {
        if (e.name === "AbortError") {
          // cancelled; ignore
          return;
        }
        // network glitch — keep trying (or surface error depending on policy)
        console.warn('job-status check failed', e);
      }
    }

    // do first immediate check, then every 1s (adjust as needed)
    check();
    pollTimer.current = window.setInterval(check, 1000);
  }, []);

  const cancelGeneration = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (generationJobId) {
      // tell server to cancel gracefully
      fetch(`/api/smart-teaching/job-cancel/${generationJobId}`, { method: 'POST' }).catch(() => {});
      setGenerationJobId(null);
    }
    setIsGenerating(false);
    setGenerationProgress(null);
  }, [generationJobId]);

  useEffect(() => {
    // clean up on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (pollTimer.current) window.clearInterval(pollTimer.current);
    };
  }, []);

  // Example: start automatically when lessonData becomes available
  useEffect(() => {
    if (!lessonData) return;
    // if generatedContent cached in memory, reuse
    if (!generatedContent) startGeneration();
  }, [lessonData?.lesson?.id]); // eslint-disable-line

  return (
    <div>
      <EnhancedSmartLearningCanvas
        generatedContent={generatedContent}
        isGenerating={isGenerating}
        progress={generationProgress}
        onRegenerate={() => startGeneration({ force: true })}
        onCancel={cancelGeneration}
        error={error}
        lessonData={lessonData}
      />
    </div>
  );
}

Child (presentational)
// EnhancedSmartLearningCanvas.tsx (child)
export default function EnhancedSmartLearningCanvas({
  generatedContent,
  isGenerating,
  progress,
  onRegenerate,
  onCancel,
  error,
  lessonData
}) {
  return (
    <div>
      {isGenerating ? (
        <div>
          <p>Generating — {progress ?? 0}%</p>
          <button onClick={onCancel}>Cancel</button>
        </div>
      ) : generatedContent ? (
        <div>{/* render generated content */}</div>
      ) : (
        <div>
          <p>No generated content</p>
          <button onClick={() => onRegenerate()}>Generate</button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

Backend — production-grade approach
Key ideas

Use idempotency key (client supplies or server derives lessonId:userId) to detect duplicates.

Use Redis locks (SET resource_key NX PX timeout) or DB unique constraint to prevent duplicate job starts.

Persist job state in DB/Redis (status, progress, result pointer).

Return { jobId } immediately and run job in background (worker).

Provide /job-status/:jobId and optional SSE /job-events/:jobId.

Example: NestJS-like pseudocode
Start job endpoint
// POST /api/smart-teaching/generate-content
// body: { lessonId, userId, idempotencyKey, force }

@Post('generate-content')
async createJob(@Body() body) {
  const { idempotencyKey, lessonId, userId, force } = body;

  // Try to find existing job by idempotencyKey
  let existing = await jobRepo.findOne({ where: { idempotencyKey }});
  if (existing && !force) {
    // If job already completed, return same jobId; if running, return jobId
    return { jobId: existing.id };
  }

  // Acquire Redis lock (SETNX)
  const lockKey = `gen-lock:${idempotencyKey}`;
  const got = await redis.set(lockKey, '1', 'NX', 'PX', 60_000); // 60s lock
  if (!got) {
    // Another request just started the job — return that job if known
    existing = await jobRepo.findOne({ where: { idempotencyKey }});
    if (existing) return { jobId: existing.id };
    // Fallback: respond with 202 and instruct to poll
    return { jobId: null, message: 'Already in progress, poll status' };
  }

  // Create job row
  const job = await jobRepo.save({ idempotencyKey, lessonId, userId, status: 'pending', progress: 0 });
  // enqueue background worker (e.g., BullMQ / Redis queue) to process job
  await queue.add('generate-content', { jobId: job.id, lessonId, userId });

  // release lock (or let worker extend/release)
  await redis.del(lockKey);

  return { jobId: job.id };
}

Worker (background)

Worker pulls job from queue, sets status to running, streams progress updates into job record (and into Redis pubsub or SSE channel), writes final result to storage (S3 / DB) and updates status=completed.

Worker handles retries, exponential backoff, and uses same idempotencyKey to avoid duplicate full generation.

Job status & cancel

GET /job-status/:jobId returns { status, progress, resultUrl? }.

POST /job-cancel/:jobId sets job status to cancelled and worker should check periodically for cancellation.

Additional production considerations

Cache generated content — store results keyed by lessonId:userId and return cached result when found (helps UX & cost).

Auth & permissions — validate user can request generation for that lesson.

Rate limiting & quotas — limit how often a user can request generation (avoid abuse).

Cost control — if generation triggers expensive LLM usage, track consumption per user and decide throttling/cost center.

Retries & idempotency — backend should be robust to duplicate requests, network failure, and worker restarts.

Observability — emit metrics and logs for job start/duration/errors. Use Sentry/Prometheus.

Testing — unit tests for job start, lock behavior, cancellation, and integration test for end-to-end job flow.

StrictMode compatibility — with parent-owned approach and backend idempotency, React StrictMode double-mounts are harmless.

Progress UX — SSE/websocket is nicer than polling. If you use SSE, the parent subscribes to /job-events/:jobId and updates progress in real-time.

How to roll it out in your repo (practical steps)

Implement parent-owned generation in UnifiedSmartTeachingInterface (replace child useEffect trigger). Use the code above as a direct patch.

Convert EnhancedSmartLearningCanvas into presentational component that only receives props.

Add idempotencyKey to generation request body.

Implement backend job creation + Redis lock and background worker (or make your existing endpoint check idempotency and return a jobId).

Add job-status endpoint (and optionally SSE).

Add tests and monitor—deploy behind feature flag first if you want safe rollout.

Quick note on StrictMode and module-level locks

Module-level locks (like generationLocks Set) are an OK fallback and fix immediate double-fetching during dev, but they are not a full solution for a large system. Rely primarily on the parent-owned flow + backend idempotency for production robustness.

Final recommendation (one-sentence)

Use parent-owned generation + idempotent, job-based backend with Redis locking and background workers — it’s architecturally correct for a large project, prevents duplicates, gives good UX for progress/cancellation, and scales.