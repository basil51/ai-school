# Guardian Weekly Email Summaries

Send automatic weekly progress summaries to student guardians. Uses **Prisma + Postgres**, **Resend** (or SMTP/Nodemailer), and either **Vercel Cron** or **GitHub Actions** to schedule.

---

## 1) Dependencies

```bash
cd web
pnpm add resend @react-email/components # or: pnpm add nodemailer
```

Set env in `web/.env.local`:

```env
RESEND_API_KEY=your_resend_key
EMAIL_FROM="AI School <no-reply@yourdomain>"
PUBLIC_APP_URL=https://your-app.example
CRON_SECRET=change-me
```

> If you prefer SMTP: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and use Nodemailer instead of Resend.

---

## 2) Prisma schema additions (Guardian ↔ Student link)

Add to `prisma/schema.prisma`:

```prisma
enum ConsentStatus { pending granted revoked }

model StudentGuardian {
  id          String        @id @default(cuid())
  studentId   String
  guardianId  String
  status      ConsentStatus @default(pending)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  student     User          @relation("StudentLinks", fields: [studentId], references: [id], onDelete: Cascade)
  guardian    User          @relation("GuardianLinks", fields: [guardianId], references: [id], onDelete: Cascade)

  @@unique([studentId, guardianId])
}

// (Optional) Keep weekly snapshots for quick queries / auditing
model ProgressSnapshot {
  id         String   @id @default(cuid())
  studentId  String
  weekStart  DateTime
  weekEnd    DateTime
  masteryAvg Float
  attempts   Int
  correctPct Float
  createdAt  DateTime @default(now())

  student    User     @relation(fields: [studentId], references: [id], onDelete: Cascade)
  @@unique([studentId, weekStart])
}
```

Run migrations:

```bash
pnpm prisma migrate dev -n guardian_links
```

---

## 3) Report generator

Create `src/lib/reports/guardian.ts`:

```ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export type StudentWeekly = {
  studentId: string;
  studentName: string;
  masteryAvg: number;
  attempts: number;
  correctPct: number;
  highlights: string[];
};

export async function getGuardianWeekly(guardianId: string, start: Date, end: Date) {
  // Find linked students with granted consent
  const links = await prisma.studentGuardian.findMany({
    where: { guardianId, status: "granted" },
    include: { student: true },
  });

  const results: StudentWeekly[] = [];
  for (const link of links) {
    const student = link.student;

    // Attempts in range
    const attempts = await prisma.attempt.findMany({
      where: {
        studentId: student.id,
        createdAt: { gte: start, lt: end },
      },
      select: { correct: true },
    });

    const total = attempts.length;
    const correct = attempts.filter((a) => a.correct === true).length;
    const correctPct = total ? Math.round((correct / total) * 100) : 0;

    // Mastery average across LOs touched in range
    const masteryRows = await prisma.mastery.findMany({ where: { studentId: student.id } });
    const masteryAvg = masteryRows.length
      ? Math.round((masteryRows.reduce((s, m) => s + m.estimate, 0) / masteryRows.length) * 100)
      : 0;

    // Simple highlights
    const highlights: string[] = [];
    if (correctPct >= 80) highlights.push("Great quiz performance this week");
    if (masteryAvg >= 70) highlights.push("Mastery trending solid");
    if (!highlights.length) highlights.push("Steady progress—keep it up!");

    results.push({
      studentId: student.id,
      studentName: student.name ?? "Student",
      masteryAvg,
      attempts: total,
      correctPct,
      highlights,
    });
  }

  return results;
}
```

---

## 4) Email sender (Resend)

Create `src/lib/email/sender.ts`:

```ts
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  });
}
```

Create simple template `src/emails/guardian-weekly.ts`:

```ts
export function renderGuardianWeekly(guardianName: string, weekLabel: string, rows: {
  studentName: string;
  masteryAvg: number;
  attempts: number;
  correctPct: number;
  highlights: string[];
}[]) {
  const items = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.studentName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.masteryAvg}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.attempts}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.correctPct}%</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${r.highlights.join("; ")}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial, sans-serif;">
    <h2>Weekly Progress Summary</h2>
    <p>Hello ${guardianName}, here is the weekly update for ${weekLabel}.</p>
    <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #333;">Student</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #333;">Mastery Avg</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #333;">Attempts</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #333;">Correct</th>
          <th align="left" style="padding:8px 12px;border-bottom:2px solid #333;">Highlights</th>
        </tr>
      </thead>
      <tbody>${items}</tbody>
    </table>
    <p style="margin-top:16px;">Visit your dashboard: <a href="${process.env.PUBLIC_APP_URL}">${process.env.PUBLIC_APP_URL}</a></p>
  </div>`;
}
```

---

## 5) Cron-secured API endpoint

Create `src/app/api/cron/guardian-weekly/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getGuardianWeekly } from "@/lib/reports/guardian";
import { sendEmail } from "@/lib/email/sender";
import { renderGuardianWeekly } from "@/emails/guardian-weekly";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-cron-secret");
  if (auth !== process.env.CRON_SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Week window (Mon 00:00 → Sun 23:59) relative to now
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7; // 0 for Monday
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const guardians = await prisma.user.findMany({ where: { role: "guardian" } });

  let sent = 0;
  for (const g of guardians) {
    if (!g.email) continue;
    const rows = await getGuardianWeekly(g.id, start, end);
    if (!rows.length) continue;
    const html = renderGuardianWeekly(g.name ?? "Guardian", `${start.toDateString()} - ${new Date(end.getTime()-1).toDateString()}`, rows);
    await sendEmail(g.email, "Weekly Progress Summary", html);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
```

---

## 6) Scheduling

### Option A: **Vercel Cron**

Add `vercel.json` in repo root:

```json
{
  "crons": [
    { "path": "/api/cron/guardian-weekly", "schedule": "0 7 * * MON" }
  ]
}
```

Set `CRON_SECRET` in Vercel env and configure the project to send `x-cron-secret` header (Vercel Cron supports static headers via project settings or use a tiny proxy function that injects it).

### Option B: **GitHub Actions** caller

Create `.github/workflows/guardian-weekly.yml`:

```yaml
name: guardian-weekly
on:
  schedule:
    - cron: "0 7 * * 1" # Mondays 07:00 UTC
jobs:
  call:
    runs-on: ubuntu-latest
    steps:
      - name: Call cron endpoint
        run: |
          curl -X POST "$APP_URL/api/cron/guardian-weekly" \
            -H "x-cron-secret: $CRON_SECRET" \
            -H "Content-Type: application/json" \
            -d '{}'
        env:
          APP_URL: ${{ secrets.APP_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

---

## 7) Security & Compliance

* Send emails **only** to guardians with `ConsentStatus=granted`.
* Include **unsubscribe/manage preferences** link (e.g., profile page) if operating as a general SaaS.
* Rate-limit email sending to avoid provider throttling.
* Localize subject/body with your i18n files if necessary.

---

## 8) Quick test

1. Seed a guardian + link to a student with `status=granted`.
2. Create a few Attempts for the last 7 days.
3. Run: `curl -X POST -H "x-cron-secret: $CRON_SECRET" $APP_URL/api/cron/guardian-weekly`.
4. Check inbox.
