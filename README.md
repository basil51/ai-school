# AI School — Complete Learning Platform

A production-grade Next.js learning platform with AI-powered tutoring, RAG (Retrieval-Augmented Generation), and comprehensive guardian communication system. Built with **pnpm, Next.js (App Router + TS), TailwindCSS, PostgreSQL (Prisma), OpenAI, and Resend**.

## Features

- 🤖 **AI-Powered Tutoring**: Streaming chat with RAG-based responses
- 📚 **Document Management**: Upload and ingest educational content
- 🔍 **Hybrid Search**: BM25 + vector search for better retrieval
- 📊 **Quality Evaluation**: RAGAS metrics for system performance
- 👥 **Role-Based Access**: Students, Teachers, Guardians, Admins
- 📧 **Guardian Communication**: Weekly progress reports via email
- 🔄 **Background Processing**: Async document ingestion with Redis/BullMQ
- 🎨 **Modern UI**: shadcn/ui components with responsive design

---

## 0) Prerequisites

* **Node.js** ≥ 20 (LTS). Enable corepack: `corepack enable`
* **pnpm** ≥ 9: `corepack prepare pnpm@latest --activate`
* **Git** installed
* **Docker** (optional, for local Postgres)

---

## 1) Create the project folder

```bash
mkdir ai-school && cd ai-school
git init
```

---

## 2) Scaffold with Create Next App (Recommended)

```bash
pnpm dlx create-next-app@latest web \
  --typescript \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm

cd web
pnpm dev
```

Verify [http://localhost:3006](http://localhost:3006) works.

### Add TailwindCSS

```bash
pnpm dlx tailwindcss init -p
```

Configure `tailwind.config.js` with `src/app/**/*` etc. Add to `globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Add UI + Data Libs

```bash
pnpm add axios @tanstack/react-query
```

*(Optional)* shadcn/ui:

```bash
pnpm dlx shadcn-ui@latest init -d
pnpm dlx shadcn-ui@latest add button card input dialog
```

### Add ESLint/Prettier

```bash
pnpm add -D prettier eslint-config-prettier eslint-plugin-simple-import-sort
```

---

## 3) PostgreSQL + Prisma

### Dockerized Postgres

`docker-compose.yml`:

```yaml
version: "3.9"
services:
  db:
    image: postgres:15
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_school
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

Run: `docker compose up -d`

### Install Prisma

```bash
cd web
pnpm add -D prisma
pnpm add @prisma/client
pnpm dlx prisma init --datasource-provider postgresql
```

Set `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_school?schema=public"
```

---

## 4) Auth + Roles

### Install NextAuth.js

```bash
pnpm add next-auth
```

### Prisma Schema (web/prisma/schema.prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  createdAt DateTime @default(now())
}

enum Role {
  STUDENT
  TEACHER
  GUARDIAN
  ADMIN
}
```

### Hash passwords with Argon2

```bash
pnpm add argon2
```

### Auth route (simplified)

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const user = await prisma.user.findUnique({ where: { email: creds?.email } });
        if (!user) return null;
        const valid = await argon2.verify(user.password, creds!.password);
        return valid ? { id: user.id, email: user.email, role: user.role } : null;
      },
    }),
  ],
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
```

### Middleware for role protection

```ts
// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = { matcher: ["/dashboard/:path*"] };
```

---

## 5) Seed Script

Add `prisma/seed.ts`:

```ts
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const pw = await argon2.hash("password123");
  await prisma.user.createMany({
    data: [
      { email: "student@example.com", password: pw, role: Role.STUDENT },
      { email: "teacher@example.com", password: pw, role: Role.TEACHER },
      { email: "guardian@example.com", password: pw, role: Role.GUARDIAN },
      { email: "admin@example.com", password: pw, role: Role.ADMIN },
    ],
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

Update `package.json`:

```json
"scripts": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Run: `pnpm seed`

---

## 6) Folder structure (after setup)

```
web/
├─ src/
│  ├─ app/
│  │  ├─ api/auth/[...nextauth]/route.ts
│  │  ├─ api/health/route.ts
│  │  ├─ dashboard/
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  ├─ lib/env.ts
│  └─ styles/globals.css
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/
├─ package.json
├─ tailwind.config.js
├─ .env
```

---

## 7) Quickstart Cheatsheet

```bash
mkdir ai-school && cd ai-school && git init
pnpm dlx create-next-app@latest web --typescript --eslint --app --src-dir --import-alias "@/*" --use-pnpm
cd web && pnpm dlx tailwindcss init -p
pnpm add axios @tanstack/react-query next-auth argon2
pnpm add -D prisma @prisma/client ts-node
# start Postgres with docker compose from root
cd .. && docker compose up -d
# migrate + seed
cd web && pnpm dlx prisma migrate dev --name init && pnpm seed
# run app
pnpm dev
```

You now have: **Next.js + Tailwind + Axios + Prisma/Postgres + NextAuth roles + seed users** ready to build on.

---

## 8) Auth + Roles (NextAuth + Credentials) 🚪

This adds email/password auth, sessions, and basic RBAC (student/teacher/guardian/admin). It uses **NextAuth** with a **Credentials** provider and Prisma.

### Install

```bash
cd web
pnpm add next-auth @auth/prisma-adapter argon2 zod
```

### Env

Create/update `.env`:

```env
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET="change-me-32+chars"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_school?schema=public"
```

> Generate a strong secret: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`

### Prisma schema (add/merge)

`prisma/schema.prisma`

```prisma
// --- Auth roles ---
enum Role { student teacher guardian admin }

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String?  // null if using OAuth-only
  role      Role     @default(student)
  createdAt DateTime @default(now())
  // NextAuth relations
  accounts  Account[]
  sessions  Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

Run migrations:

```bash
pnpm prisma migrate dev -n auth_init
pnpm prisma generate
```

### NextAuth route handler

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import argon2 from "argon2";

const prisma = new PrismaClient();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email & Password",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const ok = await argon2.verify(user.password, password);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      (session as any).role = token.role;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

### Register endpoint (hash password)

Create `src/app/api/auth/register/route.ts`:

```ts
import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, name, role } = body ?? {};
  if (!email || !password) return NextResponse.json({ error: "Missing" }, { status: 400 });
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.user.create({
    data: { email, password: hash, name: name ?? null, role: (role ?? "student") as Role },
  });
  return NextResponse.json({ id: user.id, email: user.email });
}
```

### Client helpers

* Add a sign-in form at `src/app/(auth)/signin/page.tsx` using `signIn("credentials")` from `next-auth/react`.
* Wrap `src/app/layout.tsx` with `SessionProvider`.

```bash
pnpm add next-auth@latest
```

Example provider in `layout.tsx`:

```tsx
// src/app/providers.tsx
"use client";
import { SessionProvider } from "next-auth/react";
export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Use in `layout.tsx`:

```tsx
import Providers from "@/app/providers";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body><Providers>{children}</Providers></body></html>
  );
}
```

### RBAC utilities

Create `src/lib/rbac.ts`:

```ts
import { getServerSession } from "next-auth";
import { auth } from "next-auth"; // if you exported it; else import your options

export async function requireRole(roles: string[]) {
  const session = await getServerSession();
  if (!session || !roles.includes((session as any).role)) {
    throw new Response("Forbidden", { status: 403 });
  }
}
```

Use in route handlers:

```ts
// example route
export async function GET() {
  await requireRole(["teacher", "admin"]);
  return Response.json({ ok: true });
}
```

### Middleware (protect app sections)

`src/middleware.ts`:

```ts
import { withAuth } from "next-auth/middleware";
export default withAuth({});
export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/teacher/:path*"] };
```

---

## 9) Seed Script (Demo Org/Users/Data) 🌱

Add `prisma/seed.ts`:

```ts
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";
const prisma = new PrismaClient();

async function main() {
  const users = [
    { email: "admin@example.com", role: "admin" as Role, name: "Admin", pass: "admin123" },
    { email: "teacher@example.com", role: "teacher" as Role, name: "Teacher Tina", pass: "teach123" },
    { email: "student@example.com", role: "student" as Role, name: "Student Sam", pass: "study123" },
    { email: "guardian@example.com", role: "guardian" as Role, name: "Guardian G", pass: "guard123" },
  ];

  for (const u of users) {
    const hash = await argon2.hash(u.pass, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, role: u.role, password: hash },
    });
  }
  console.log("Seeded demo users.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
```

Wire it in `package.json` (inside `web/`):

```json
{
  "prisma": { "seed": "ts-node --transpile-only prisma/seed.ts" },
  "devDependencies": { "ts-node": "^10.9.2" }
}
```

Install `ts-node` and run:

```bash
pnpm add -D ts-node
pnpm prisma db seed
```

Login with:

* **[admin@example.com](mailto:admin@example.com) / admin123**
* **[teacher@example.com](mailto:teacher@example.com) / teach123**
* **[student@example.com](mailto:student@example.com) / study123**
* **[guardian@example.com](mailto:guardian@example.com) / guard123**

---

## 10) Quick test

* Start DB: `docker compose up -d`
* Migrate: `pnpm prisma migrate dev`
* Seed: `pnpm prisma db seed`
* Run: `pnpm dev`
* Visit `/api/auth/signin` and sign in with seeded users.

You now have **auth + roles + seed data** ready to go. Next, we can scaffold **RAG ingestion** and the first **lesson/tutor** endpoints.

---

## 11) Deploy (Phase 7)

### Environment variables
Create envs in Vercel (or `.env.production` locally):

```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=replace-with-strong-secret
DATABASE_URL=postgresql://user:pass@host:5432/ai_school?schema=public
OPENAI_API_KEY=sk-...
REDIS_URL=redis://user:pass@host:6379
```

### Migrations and start

```
cd web
pnpm install
pnpm migrate:deploy
pnpm build && pnpm start
```

Health check: `GET /api/health` should return `{ status: "ok" }`.
