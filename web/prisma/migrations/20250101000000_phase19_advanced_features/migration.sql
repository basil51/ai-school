-- CreateEnum
CREATE TYPE "AdvancedTeachingMethodType" AS ENUM ('socratic_method', 'spaced_repetition', 'cognitive_apprenticeship', 'metacognitive_strategies', 'multimodal_learning', 'adaptive_difficulty', 'peer_learning', 'gamification');

-- CreateEnum
CREATE TYPE "ContentModality" AS ENUM ('text', 'visual', 'audio', 'interactive', 'multimodal');

-- CreateEnum
CREATE TYPE "ContentLength" AS ENUM ('short', 'medium', 'long');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'completed', 'paused');

-- CreateTable
CREATE TABLE "AdvancedTeachingMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pedagogicalApproach" TEXT NOT NULL,
    "cognitiveLoad" TEXT NOT NULL,
    "engagementLevel" TEXT NOT NULL,
    "retentionRate" DOUBLE PRECISION NOT NULL,
    "prerequisites" TEXT[],
    "bestFor" TEXT[],
    "examples" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvancedTeachingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnhancedContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "modality" "ContentModality" NOT NULL,
    "length" "ContentLength" NOT NULL,
    "learningObjectives" TEXT[],
    "prerequisites" TEXT[],
    "keyConcepts" TEXT[],
    "examples" TEXT[],
    "estimatedTime" INTEGER NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "accessibility" BOOLEAN NOT NULL DEFAULT true,
    "seoOptimized" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "culturalContext" TEXT NOT NULL DEFAULT 'universal',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "EnhancedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisualElement" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "interactive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VisualElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractiveElement" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,

    CONSTRAINT "InteractiveElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioElement" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "AudioElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "expectedOutcome" TEXT NOT NULL,
    "hints" TEXT[],
    "solution" TEXT NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sessionData" JSONB NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingEffectiveness" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "effectiveness" DOUBLE PRECISION NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "assessmentScore" DOUBLE PRECISION NOT NULL,
    "engagementLevel" DOUBLE PRECISION NOT NULL,
    "retentionRate" DOUBLE PRECISION NOT NULL,
    "recommendations" TEXT[],
    "alternativeMethods" TEXT[],
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachingEffectiveness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetrics" (
    "id" TEXT NOT NULL,
    "systemHealth" DOUBLE PRECISION NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "cacheHitRate" DOUBLE PRECISION NOT NULL,
    "adaptationAccuracy" DOUBLE PRECISION NOT NULL,
    "studentSatisfaction" DOUBLE PRECISION NOT NULL,
    "learningOutcomes" DOUBLE PRECISION NOT NULL,
    "systemUptime" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "ttl" INTEGER NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvancedTeachingMethod_name_key" ON "AdvancedTeachingMethod"("name");

-- CreateIndex
CREATE INDEX "EnhancedContent_subject_topic_idx" ON "EnhancedContent"("subject", "topic");

-- CreateIndex
CREATE INDEX "EnhancedContent_difficulty_idx" ON "EnhancedContent"("difficulty");

-- CreateIndex
CREATE INDEX "EnhancedContent_modality_idx" ON "EnhancedContent"("modality");

-- CreateIndex
CREATE INDEX "LearningSession_studentId_idx" ON "LearningSession"("studentId");

-- CreateIndex
CREATE INDEX "LearningSession_status_idx" ON "LearningSession"("status");

-- CreateIndex
CREATE INDEX "LearningSession_startTime_idx" ON "LearningSession"("startTime");

-- CreateIndex
CREATE INDEX "TeachingEffectiveness_studentId_idx" ON "TeachingEffectiveness"("studentId");

-- CreateIndex
CREATE INDEX "TeachingEffectiveness_methodId_idx" ON "TeachingEffectiveness"("methodId");

-- CreateIndex
CREATE INDEX "ContentCache_cacheKey_idx" ON "ContentCache"("cacheKey");

-- CreateIndex
CREATE INDEX "ContentCache_expiresAt_idx" ON "ContentCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "VisualElement" ADD CONSTRAINT "VisualElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EnhancedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractiveElement" ADD CONSTRAINT "InteractiveElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EnhancedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioElement" ADD CONSTRAINT "AudioElement_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EnhancedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EnhancedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "EnhancedContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingEffectiveness" ADD CONSTRAINT "TeachingEffectiveness_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingEffectiveness" ADD CONSTRAINT "TeachingEffectiveness_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "AdvancedTeachingMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
