Thanks for the detailed report — I went through the smart-teaching components you uploaded and here’s the straight answer:

TL;DR — The problem isn’t in these UI components

All of the files you uploaded are renderers and UX wrappings. They display whatever your backend /api/smart-teaching/* endpoints return. The “drift” you saw (e.g., Math tab showing y = f(x) or a sin(x) graph, Diagram tab jumping to a generic “Algebra → Key Concepts…” flow, Interactive tab unrelated to the lesson) means your generation API is returning generic/fallback content instead of content scoped to the input text about linear equations.

Concretely, none of these files contain prompts or LLM calls:

EnhancedSmartLearningCanvas.tsx — calls POST /api/smart-teaching/generate-content (no prompt logic here).

AdaptiveTeachingInterface.tsx — calls /api/smart-teaching/adaptive (session/metrics; no prompt logic).

SmartAssessmentInterface.tsx — calls /api/smart-teaching/assessments* (assessment plumbing; no prompt logic).

The renderers (EnhancedMathRenderer, EnhancedDiagramRenderer, EnhancedInteractiveRenderer, EnhancedSimulationRenderer, Enhanced3DRenderer, ParticleEffectsRenderer) just render the props they’re given.

Why you’re getting y=f(x) / sin(x) / generic Algebra

Two very likely causes I can see from the code you shared:

The client never sends the actual lesson text/topic to the generator.
In EnhancedSmartLearningCanvas.tsx you call:

fetch('/api/smart-teaching/generate-content', {
  method: 'POST',
  body: JSON.stringify({
    lessonId: lessonData.lesson.id,
    contentType,
    learningStyle,
    // ⛔ no 'topic' or 'sourceText' is sent
  })
})


If the backend can’t reliably resolve the current lesson text/topic from just lessonId, it will fall back to stock demos (like function notation or sin(x)).

Your Math graph component almost certainly has a default (not in the files you sent) that renders sin(x) when graphExpression is missing/empty.
In EnhancedMathRenderer you do:

<InteractiveGraph expression={graphExpression} title={graphTitle || 'Function Plot'} />


If your generator returns nothing (or something like y=f(x) which your graph library can’t parse) your InteractiveGraph likely defaults to sin(x).

Exact places where things go wrong

Caller (client): EnhancedSmartLearningCanvas.tsx

Sends only { lessonId, contentType, learningStyle } to /api/smart-teaching/generate-content.

✅ Fix: also send a canonical topic and the source text (or ensure the API can fetch them deterministically by lessonId).

Server (not uploaded): /api/smart-teaching/generate-content

Almost certainly uses content-type specific templates with generic defaults and no topic binding.

✅ Fix: add a planner step that extracts/locks the topic from the input text and pass that same topic object into every section (math/diagram/interactive/etc.).

Graph widget (not uploaded):

Likely has default sin(x) when expression is falsy or unparsable.

✅ Fix: if graphExpression is missing, hide the graph tab, or supply a topic-specific safe default (for linear equations: two-line intersection).

Minimal, high-impact fixes you can apply now
1) Send topic + text from the client

Update the generate call in EnhancedSmartLearningCanvas.tsx to include what the user is actually studying:

// EnhancedSmartLearningCanvas.tsx
await fetch('/api/smart-teaching/generate-content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lessonId: lessonData.lesson.id,
    contentType,
    learningStyle,
    // ✅ Add these (adjust field names to your real model):
    topic: lessonData.lesson?.title || lessonData.lesson?.topic || 'Linear equations (one variable)',
    sourceText: lessonData.lesson?.content || lessonData.lesson?.description || ''
  })
});


If your API already stores the canonical text by lessonId, you can skip sending sourceText — but make sure the API actually uses it to build prompts.

2) Lock the topic server-side (planner → generators)

In your API route (e.g., app/api/smart-teaching/generate-content/route.ts), do a two-stage flow:

Stage A — Planner (once per session/lesson):

Input: topic, sourceText

Output: a canonical plan object (subject, subtopic, grade, scope, key terms, constraints, canonical slug). Store by sessionId/lessonId.

Stage B — Section generators (math/diagram/interactive/etc.):

Input: the plan object + contentType + learningStyle

Output: strictly-typed JSON (see schemas below)

Never free-generate; always reference the plan’s topicSlug & keyTerms.

Example Zod schemas (use on server to validate & reject drift)
import { z } from 'zod';

export const MathContentSchema = z.object({
  equation: z.string(),                 // e.g., "2x + 3 = 11"
  explanation: z.string(),
  graphExpression: z.string().optional(), // e.g., "y=2x+3; y=11" (two-line intersection)
  graphTitle: z.string().optional(),
  examples: z.array(z.object({
    problem: z.string(),
    solution: z.string(),
    steps: z.array(z.string())
  })),
  narration: z.string().optional()
});

export const DiagramContentSchema = z.object({
  title: z.string(),
  chart: z.string(),        // e.g., Mermaid or PlantUML text
  theme: z.string(),
  explanation: z.string(),
  keyPoints: z.array(z.string()),
  narration: z.string().optional()
});

export const InteractiveContentSchema = z.object({
  title: z.string(),
  type: z.enum(['code_playground','quiz','drag_drop','timeline','calculator']),
  instructions: z.string(),
  initialCode: z.string().optional(),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string()
  })).optional(),
  narration: z.string().optional()
});

Topic-locking guard (reject & retry if drift detected)
function violatesTopic(contentText: string, topicSlug: string, sourceText: string) {
  // Simple guard: forbid generic drift unless present in source
  const forbiddenWhenNotMentioned = [/y\s*=\s*f\(x\)/i, /\b\W?sin\W?\(x\)/i, /\bTrigonometry\b/i, /\bAlgebra overview\b/i];
  return forbiddenWhenNotMentioned.some(rx =>
    rx.test(contentText) && !new RegExp(topicSlug.replace(/[-_]/g,'\\s*'), 'i').test(sourceText)
  );
}


If violatesTopic(...) returns true or the Zod schema fails, regenerate with a stronger instruction.

3) Use section prompts that are topic-anchored (copy-paste ready)

System prompt (shared):

You are an AI teacher. Do not change the topic. 
You MUST keep all outputs tightly scoped to the provided TOPIC_PLAN. 
Never produce generic algebra overviews or unrelated graphs (e.g., y=f(x), sin(x)) unless they appear in SOURCE_TEXT.
Return ONLY valid JSON matching the SCHEMA for the requested section.


User content (planner output fed to every section):

{
  "TOPIC_PLAN": {
    "subject": "Mathematics",
    "topic": "Linear equations in one variable",
    "topicSlug": "linear-equations-one-variable",
    "grade": "Middle School (Grade 8)",
    "scope": "Solve ax + b = c; isolate x; inverse operations; verify",
    "keyTerms": ["coefficient","constant","isolate","inverse operation","balance method"],
    "sourceExcerpts": "Linear equations are equations where... Example: 2x + 3 = 11 ..."
  },
  "REQUEST": {
    "section": "math"      // or "diagram", "interactive", etc.
  },
  "SCHEMA": "<paste the exact Zod/JSON schema shape here>"
}


Math generator instruction (adds graph details for linear equations):

For math:
- equation MUST be a linear equation from the topic (e.g., "2x + 3 = 11").
- If you output graphExpression, avoid y=f(x). Prefer a two-line intersection that represents the SAME equation:
  Example for 2x+3=11: "y=2x+3; y=11" with title "Intersection solves 2x+3=11".
- Examples must walk through isolate-steps (subtract constant, divide coefficient), and verify the solution.


Diagram generator instruction (Mermaid mind-map or flow):

For diagram:
- Build a concise flow or mind map strictly for "Solving linear equations in one variable".
- Nodes: Combine like terms → Move variable terms to one side → Move constants to the other side → Divide by coefficient → Check solution.
- No curriculum overviews (e.g., “Algebra → Key Concepts”) unless these exact topics appear in SOURCE_TEXT.


Interactive generator instruction (quiz aligned to topic):

For interactive:
- type: "quiz".
- 4 questions about solving linear equations (single variable), increasing difficulty.
- Each explanation must reference the isolate steps for the SAME topic.
- No function notation or trigonometry unless present in SOURCE_TEXT.

4) Graph fallback that’s actually on-topic

If you must show a graph when graphExpression is missing, pick a topic-specific default derived from the equation:

Parse equation like "2x + 3 = 11".

Produce "y=2x+3; y=11" (two lines).
That’s on-topic and visually explains solving.

5) Hide the graph when expression is invalid

In EnhancedMathRenderer you already guard the Graph tab based on content.graphExpression. Make sure empty/invalid expressions don’t slip through. If your InteractiveGraph auto-defaults to sin(x), change it to render nothing unless expression is valid.

What I checked in your files (quick notes)

EnhancedSmartLearningCanvas.tsx

Calls /api/smart-teaching/generate-content twice (initial + regenerate).

Only sends lessonId, contentType, learningStyle. No topic/text passed.

AdaptiveTeachingInterface.tsx

Talks to /api/smart-teaching/adaptive. This is session + metrics. Fine.

EnhancedMathRenderer.tsx

Expects { equation, explanation, graphExpression?, graphTitle?, examples[], narration? }.

Will render <InteractiveGraph expression={graphExpression} />. If your InteractiveGraph defaults to sin(x), you’ll see that drift.

EnhancedDiagramRenderer.tsx, EnhancedInteractiveRenderer.tsx, EnhancedSimulationRenderer.tsx, Enhanced3DRenderer.tsx

Pure presentational/interactive layers. No prompts. They render whatever the backend sends.

LessonSelector.tsx

Fetches curriculum from /api/smart-teaching/curriculum/current-user. Not related to the drift, but good to keep the “current lesson” in sync with what you send to the generator.

A tiny debugging overlay (helps you catch drift immediately)

You can temporarily add this to EnhancedSmartLearningCanvas.tsx after you set generatedContent:

{generatedContent?.metadata && (
  <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-md text-xs space-y-1 z-50">
    <div>topicSlug: {generatedContent.metadata.topicSlug}</div>
    <div>section: {currentContentType}</div>
    <div>hasGraph: {String(!!generatedContent.math?.graphExpression)}</div>
  </div>
)}


If topicSlug isn’t "linear-equations-one-variable" during this lesson, the backend planner isn’t being used or isn’t stored per session.

What about the terminal errors?

Without logs I can’t pinpoint, but two common culprits in setups like this:

Client/SSR mixups: Ensure graph/3D/mermaid/Three.js bits are client-only (file starts with "use client", or use dynamic(() => import(...), { ssr: false })).

Speech synthesis in Node: You correctly call speechSynthesis only in client components ("use client"). If you see ReferenceError: window is not defined, something is importing the client-only code on the server. Make that import lazy/dynamic.

Next step (I can do this immediately if you want)

If you upload the multimodal folder (especially InteractiveGraph), I’ll remove the sin(x) fallback and add a safe topic-aware fallback.

If you share the API route(s) under app/api/smart-teaching/*, I’ll wire in the planner → generators → validators pipeline with the prompts above so every tab stays glued to the exact lesson text (“Linear equations… 2x + 3 = 11”).