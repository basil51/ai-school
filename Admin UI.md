# Admin UI (Guardian Links & Email Previews) + Slack Alerts for Nightly RAG

This doc adds a small **admin console** to manage guardian ↔ student links and preview weekly emails, plus a **Slack alert** when the nightly RAG eval fails.

> Prereqs: the schema/types from **Guardian Weekly Emails** are in place (`StudentGuardian`, `ConsentStatus`) and the cron/email code exists. RBAC helper `requireRole()` available.

---

## 1) Admin Pages (Next.js)

### 1.1 Route: `/admin/guardians`

Create `src/app/admin/guardians/page.tsx`:

```tsx
import { cookies } from "next/headers";
import Link from "next/link";
import { PrismaClient, ConsentStatus, Role } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

async function getData() {
  const students = await prisma.user.findMany({ where: { role: "student" }, select: { id: true, name: true, email: true } });
  const guardians = await prisma.user.findMany({ where: { role: "guardian" }, select: { id: true, name: true, email: true } });
  const links = await prisma.studentGuardian.findMany({ include: { student: true, guardian: true } });
  return { students, guardians, links };
}

export default async function GuardianAdminPage() {
  await requireRole(["admin", "teacher"]);
  const { students, guardians, links } = await getData();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Guardian Links</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Create Link</h2>
        <form action="/api/admin/guardian-link" method="post" className="flex flex-wrap gap-2 items-center">
          <select name="studentId" className="border rounded p-2">
            {students.map(s => (<option key={s.id} value={s.id}>{s.name ?? s.email}</option>))}
          </select>
          <select name="guardianId" className="border rounded p-2">
            {guardians.map(g => (<option key={g.id} value={g.id}>{g.name ?? g.email}</option>))}
          </select>
          <select name="status" className="border rounded p-2" defaultValue="granted">
            <option value="pending">pending</option>
            <option value="granted">granted</option>
            <option value="revoked">revoked</option>
          </select>
          <button className="bg-black text-white rounded px-4 py-2">Link</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Existing Links</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2">Student</th>
              <th className="text-left p-2">Guardian</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map(l => (
              <tr key={l.id} className="border-t">
                <td className="p-2">{l.student.name ?? l.student.email}</td>
                <td className="p-2">{l.guardian.name ?? l.guardian.email}</td>
                <td className="p-2">{l.status}</td>
                <td className="p-2 space-x-2">
                  <form action="/api/admin/guardian-link" method="post" className="inline">
                    <input type="hidden" name="linkId" value={l.id} />
                    <input type="hidden" name="status" value={l.status === "granted" ? "revoked" : "granted"} />
                    <button className="underline">{l.status === "granted" ? "Revoke" : "Grant"}</button>
                  </form>
                  <a className="underline" href={`/api/admin/guardian-preview?guardianId=${l.guardianId}`} target="_blank">Preview Email</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
```

> Minimal server component page that lists users and links. Uses simple HTML forms to hit API routes.

---

## 2) Admin API routes

### 2.1 Create/Update Link — `POST /api/admin/guardian-link`

`src/app/api/admin/guardian-link/route.ts`:

```ts
import { NextResponse } from "next/server";
import { PrismaClient, ConsentStatus } from "@prisma/client";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  await requireRole(["admin", "teacher"]);

  if (req.headers.get("content-type")?.includes("application/json")) {
    const { studentId, guardianId, status, linkId } = await req.json();
    return handle({ studentId, guardianId, status, linkId });
  }
  const form = await req.formData();
  return handle({
    studentId: form.get("studentId") as string | null,
    guardianId: form.get("guardianId") as string | null,
    status: form.get("status") as string | null,
    linkId: form.get("linkId") as string | null,
  });
}

async function handle({ studentId, guardianId, status, linkId }: { studentId: string | null; guardianId: string | null; status: string | null; linkId?: string | null; }) {
  if (linkId) {
    const updated = await prisma.studentGuardian.update({ where: { id: linkId }, data: { status: (status ?? "pending") as ConsentStatus } });
    return NextResponse.redirect(new URL("/admin/guardians", process.env.NEXTAUTH_URL));
  }
  if (!studentId || !guardianId) return NextResponse.json({ error: "missing" }, { status: 400 });
  const link = await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId, guardianId } },
    update: { status: (status ?? "pending") as ConsentStatus },
    create: { studentId, guardianId, status: (status ?? "pending") as ConsentStatus },
  });
  return NextResponse.redirect(new URL("/admin/guardians", process.env.NEXTAUTH_URL));
}
```

### 2.2 Preview Email — `GET /api/admin/guardian-preview`

`src/app/api/admin/guardian-preview/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getGuardianWeekly } from "@/lib/reports/guardian";
import { renderGuardianWeekly } from "@/emails/guardian-weekly";
import { requireRole } from "@/lib/rbac";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  await requireRole(["admin", "teacher"]);
  const guardianId = req.nextUrl.searchParams.get("guardianId");
  if (!guardianId) return NextResponse.json({ error: "guardianId required" }, { status: 400 });

  const now = new Date();
  const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7);

  const guardian = await prisma.user.findUnique({ where: { id: guardianId } });
  if (!guardian) return NextResponse.json({ error: "guardian not found" }, { status: 404 });

  const rows = await getGuardianWeekly(guardianId, monday, sunday);
  const html = renderGuardianWeekly(guardian.name ?? "Guardian", `${monday.toDateString()} - ${new Date(sunday.getTime()-1).toDateString()}`, rows);
  return new NextResponse(html, { headers: { "content-type": "text/html" } });
}
```

---

## 3) Slack Alerts for Nightly RAG Failures

### 3.1 Create Slack Incoming Webhook

* In Slack, create a **Incoming Webhook** in the workspace → choose channel (e.g., `#ai-school-alerts`).
* Copy the Webhook URL and save it as a secret: `SLACK_WEBHOOK_URL` in **GitHub Secrets**.

### 3.2 Update nightly workflow

Edit `.github/workflows/nightly-ragas.yml` and append a Slack step that only runs on failure:

```yaml
name: nightly-ragas
on:
  schedule:
    - cron: "0 2 * * *"
  workflow_dispatch: {}

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install deps
        run: |
          python -m pip install --upgrade pip
          pip install ragas datasets pandas openai tiktoken requests
      - name: Run RAGAS
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          APP_URL: ${{ secrets.APP_URL }}
          MODEL_NAME: gpt-4o-mini
        run: |
          python tools/evals/ragas_eval.py
      - name: Upload artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ragas-results
          path: tools/evals/out/*
      - name: Slack alert on failure
        if: failure()
        run: |
          SUMMARY=$(cat tools/evals/out/summary.txt || echo "(no summary)" )
          PAYLOAD=$(jq -n --arg text "🚨 Nightly RAG eval failed on $GITHUB_REPOSITORY@${GITHUB_SHA::7}\n\n$SUMMARY\n\nRun: $GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" '{text: $text}')
          curl -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$SLACK_WEBHOOK_URL"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          GITHUB_SERVER_URL: https://github.com
```

> Uses `jq` (available on GitHub runners) to craft a JSON payload. The message includes repo, commit, summary, and a link to the failed run.

### 3.3 Optional: richer Slack blocks

Replace the payload with a **Block Kit** JSON for nicer formatting (title, metrics table, links).

---

## 4) Security & UX notes

* Protect `/admin/*` with middleware and RBAC (`requireRole(["admin","teacher"])`).
* Only show **Preview Email** when `ConsentStatus = granted`.
* For large orgs, paginate the students/guardians lists and add search inputs.
* Add a **dry run** query param to cron to render without sending.

---

## 5) Quick Test

1. Ensure you have a guardian linked to a student with `status=granted` (seed or UI).
2. Open `/admin/guardians`, create/revoke links.
3. Click **Preview Email** → should render HTML.
4. Manually run the nightly workflow (`Workflow dispatch`) and temporarily set thresholds to trigger a failure → confirm Slack alert.

You now have an admin console for guardian management and production-ready Slack notifications for nightly RAG regressions.
