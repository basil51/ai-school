# AI School — Roadmap

This roadmap translates README.md, RAG.md, RAG2.md, and EMAILS.md into actionable phases. Each phase ends with a working milestone and clear exit criteria.

---

## Phase 0 — Bootstrap (DONE)
- Next.js app scaffolded in `web/` (App Router + TS)
- TailwindCSS wired
- Axios, React Query installed
- Postgres via Docker (port 5433)
- Prisma initialized; `User` + `Role` models; migrated
- Seed users created

Exit criteria: `pnpm dev` runs and DB is migrated/seeded.

---

## Phase 1 — Auth + RBAC (DONE) ✅
- ✅ NextAuth Credentials provider
- ✅ Register endpoint hashing passwords (argon2)
- ✅ JWT session with role on token/session
- ✅ Middleware protecting `/dashboard`, `/teacher`, `/admin`
- ✅ Simple sign-in form and sign-out
- ✅ Dashboard with user info and role display
- ✅ RBAC utilities for API route protection

Exit criteria: Can sign in with seeded users; role-gated routes enforced. **COMPLETED**

---

## Phase 2 — RAG Foundations (DONE) ✅
- ✅ Install `openai`, `ai`, `zod`
- ✅ Enable pgvector in Postgres and Prisma types
- ✅ Create `RagDocument` and `RagChunk` models with `embedding vector(1536)` + index
- ✅ Implement helpers: chunk, embed, vector search
- ✅ API:
  - `/api/content/upload` (store doc meta, length)
  - `/api/rag/ingest` (chunk → embed → insert)
  - `/api/rag/query` (top‑k retrieval)
- ✅ Minimal UI page `/rag` for upload + ask (non‑streaming)

Exit criteria: Upload .txt, ingest, ask a question, receive grounded answer with snippets. **COMPLETED**

---

## Phase 3 — Streaming Tutor Endpoint + UI (DONE) ✅
- ✅ Add `/api/chat/lesson` streaming variant (Vercel AI SDK)
- ✅ Client page `/tutor` with streaming answer area
- ✅ Basic citations format like `[1]`, `[2]`
- ✅ Integrate RAG retrieval with streaming LLM responses
- ✅ Navigation links from home and dashboard

Exit criteria: See streamed answers citing retrieved context. **COMPLETED**

---

## Phase 4 — Ingestion at Scale (Background Jobs) (DONE) ✅
- ✅ Add Redis and BullMQ
- ✅ Worker app to process ingestion (batch embeddings, progress updates)
- ✅ API to enqueue jobs + status endpoint
- ✅ Frontend polling for job status
- ✅ Handle large documents efficiently

Exit criteria: Large docs ingest asynchronously with visible progress until completion. **COMPLETED**

---

## Phase 5 — UX + Admin (DONE) ✅
- ✅ Install and configure shadcn/ui components
- ✅ Teacher‑only uploads; admin panel for users/docs
- ✅ Role‑aware navigation and dashboards
- ✅ Modern UI components and forms
- ✅ Comprehensive admin panel with user and document management

Exit criteria: Role‑based navigation; teachers upload; admins manage users and docs. **COMPLETED**

---

## Phase 6 — Quality & Search (RAGAS Evaluations) (DONE) ✅
- ✅ Hybrid search (BM25 + vector) with tunable alpha
- ✅ Full‑text (GIN/FTS) index on `RagChunk.content`
- ✅ Vector index (IVFFLAT) on `RagChunk.embedding` and maintenance API
- ✅ UI controls on `/rag` for mode (hybrid/vector) and alpha
- RAGAS metrics: faithfulness, answer_relevancy, context_precision, context_recall
- Nightly CI with GitHub Actions
- Golden dataset with Q/A pairs
- Similarity thresholding + re‑ranking

Exit criteria: Evaluation dashboard shows nightly scores; hybrid search improves answer quality. **COMPLETED**

---

## Phase 7 — Ops & Deployment
- Environment configs, secrets
- Database migrations workflow
- Observability (logs/metrics), backups
- Deployment to Vercel (web) + managed Postgres, Redis

Exit criteria: Deployed app with monitoring and documented runbooks.

---

## Phase 8 — Guardian Emails & Communication (DONE) ✅
- ✅ Guardian ↔ Student linking with consent management
- ✅ Weekly progress summaries via email (Resend/SMTP)
- ✅ Automated cron jobs (Vercel Cron or GitHub Actions)
- ✅ Email templates and unsubscribe management

Exit criteria: Guardians receive weekly progress emails for consented students. **COMPLETED**

---

## Phase 9 — Stretch Goals (IN PROGRESS)
- ✅ Multi‑tenant orgs (schools) - Super-admin system with organization management
- ✅ Organization analytics and reporting dashboard
- ✅ Organization branding and customization
- ✅ Reusable components for better maintainability
- 🔄 Attendance/grades integrations
- 🔄 Classroom chat, lesson plans, assignment generation
- 🔄 Advanced analytics and reporting features

Exit criteria: Multi-tenant system fully operational with comprehensive analytics and customization options.

---

## Phase 10 — Internationalization (i18n) (COMPLETED) ✅
- ✅ Vanilla Next.js App Router i18n implementation (no external libraries)
- ✅ Arabic (RTL) and English (LTR) language support
- ✅ Locale-aware routing with `[locale]` dynamic segments
- ✅ Middleware for automatic locale detection and redirection
- ✅ Dynamic dictionary loading with JSON message files
- ✅ Comprehensive RTL CSS support for Arabic layout
- ✅ Language switcher in Topbar with dynamic app branding
- ✅ Translated home page with beautiful UI improvements
- ✅ Client-side translation hook (`useTranslations`)
- ✅ Proper HTML `lang` and `dir` attributes
- ✅ Accept-Language header detection
- 🔄 **Translation Phase**: Complete translation of all application pages
  - Dashboard, Admin, Tutor, RAG, Super-Admin pages
  - All UI components and forms
  - Error messages and notifications
  - Email templates and communications

Exit criteria: Fully bilingual application with complete Arabic and English translations across all pages and features. **COMPLETED**

---

## Phase 11 — UI/UX Enhancements (COMPLETED) ✅
- ✅ Streamlined Topbar navigation - removed redundant admin links
- ✅ Enhanced user dropdown with hover-based interaction
- ✅ Improved user greeting with "Hi, [name]" and "Welcome back," messages
- ✅ Language switcher repositioned for better UX
- ✅ Cleaned up Dashboard layout - removed redundant user info section
- ✅ Fixed spacing and eliminated unnecessary white space
- ✅ Professional hover effects and smooth transitions
- ✅ Mobile-friendly responsive design improvements
- ✅ Eliminated gap between user trigger and dropdown menu
- ✅ Continuous hover area for seamless dropdown interaction

Exit criteria: Modern, intuitive interface with improved user experience and smooth interactions. **COMPLETED**

---

## 🚀 NEW DIRECTION: AI Teacher Transformation

### **Phase 12 — Curriculum Engine** 🎓
*Duration: 3-4 weeks*

**Goal**: Transform from document-based Q&A to structured curriculum delivery

- **Dynamic Subject Model**: Define `Subject`, `Topic`, `Lesson` entities in the database
- **Curriculum Planner**: AI generates a structured course outline per student (progression of lessons)
- **Adaptive Pathways**: Lessons adapt based on assessment results (slow down, review, or accelerate)
- **Prerequisites System**: Ensures proper learning sequence
- **Difficulty Scaling**: Automatic adjustment based on student ability

**Exit Criteria**: Students selecting "Math" or "History" receive a personalized curriculum instead of open Q&A

---

### **Phase 13 — Assessment & Evaluation System** 📝
*Duration: 4-5 weeks*

**Goal**: Implement comprehensive assessment system for mastery verification

- **Auto-Generated Questions**: AI creates questions from lesson content
- **Multiple Question Types**: MCQ, short answer, essays, coding challenges
- **Intelligent Grading**: AI-powered auto-grading with detailed feedback
- **Mastery Tracking**: Progress only after demonstrating understanding
- **Adaptive Difficulty**: Questions adjust based on student performance

**Exit Criteria**: Students progress only after completing and passing quizzes/tests

---

### **Phase 14 — Adaptive Teaching Engine** 🧠
*Duration: 5-6 weeks*

**Goal**: Implement intelligent adaptation system that changes teaching approach based on student performance

- **Failure Recovery**: If student fails, AI re-teaches with a different approach
- **Learning Style Detection**: ML-based identification of optimal learning modalities
- **Content Regeneration**: AI creates new explanations when students struggle
- **Alternative Modalities**: Visual (charts, diagrams), analogy-based, step-by-step methods
- **Review Cycles**: Students retry until mastery is demonstrated

**Exit Criteria**: Students see "Try Again" with fresh explanations until they pass

---

### **Phase 15 — Multi-Modal Teaching Interface** 🎨
*Duration: 4-5 weeks*

**Goal**: Enhance learning with visual, auditory, and interactive content

- **Mathematical Rendering**: KaTeX/MathJax for equations and formulas
- **Visual Diagrams**: Mermaid, D3.js for dynamic visualizations
- **Interactive Simulations**: Physics simulations, math graphing tools
- **Text-to-Speech**: Accessible audio explanations and narrations
- **Code Execution**: In-browser coding environments for programming subjects

**Exit Criteria**: At least one subject (Math) taught with text, equations, and visual aids

---

### **Phase 16 — Personalization & Memory Engine** 🧩
*Duration: 4-5 weeks*

**Goal**: Create long-term learning memory that continuously improves the AI teacher for each student

- **Student Profiles**: Track strengths, weaknesses, and learning style preferences
- **Learning History**: Store which explanation types were most effective per student
- **Personalization Engine**: Future lessons adapt based on past performance and preferences
- **Learning Analytics**: Advanced metrics and insights for students, teachers, and parents
- **Knowledge Retention**: Spaced repetition for long-term memory enhancement

**Exit Criteria**: Each student gets a continuously improving AI teacher experience

---

## 🎯 Success Metrics

### **Student Success Metrics**
- **Mastery Rate**: >90% of students achieving lesson objectives
- **Retention Rate**: >85% knowledge retention after 30/60/90 days
- **Engagement Score**: >8/10 student satisfaction and time spent
- **Learning Velocity**: 25% faster concept mastery than traditional methods

### **System Performance Metrics**
- **Adaptation Accuracy**: >80% success rate of personalized content
- **Response Time**: <2s for content generation and delivery
- **Content Quality**: >95% relevance and accuracy of AI-generated content
- **User Satisfaction**: >4.5/5 from students, teachers, and parents

---

## 📋 Implementation Timeline

**Total Duration**: 6-8 months for complete transformation

1. **Phase 12**: January 2025 (Curriculum Engine)
2. **Phase 13**: March 2025 (Assessment System)
3. **Phase 14**: May 2025 (Adaptive Teaching)
4. **Phase 15**: July 2025 (Multi-Modal Interface)
5. **Phase 16**: September 2025 (Personalization Engine)

---

## Tracking
- See `STATUS.md` for weekly status, blockers, and next actions
- See `AI_TEACHER_COMPREHENSIVE_PLAN.md` for detailed implementation specifications


