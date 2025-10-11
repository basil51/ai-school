import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookQuestionExtractor } from "@/lib/assessment/book-question-extractor";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { bookId, content, title } = await request.json();

    if (!bookId || !content) {
      return NextResponse.json(
        { error: "bookId and content are required" },
        { status: 400 }
      );
    }

    console.log(`🔄 [DEBUG] Starting book parsing for book ${bookId}`);

    // For now, create a simple structure with basic units
    // In production, this would use sophisticated PDF parsing and TOC detection
    const units = await createBookUnits(bookId, content, title);

    console.log(`✅ [DEBUG] Created ${units.length} units for book ${bookId}`);

    // Create lessons for each unit
    let totalLessons = 0;
    let totalQuestions = 0;
    for (const unit of units) {
      const { lessons, questions } = await createLessonsForUnit(unit.id, unit.content, unit.title);
      totalLessons += lessons.length;
      totalQuestions += questions;
    }

    console.log(`✅ [DEBUG] Created ${totalLessons} lessons for book ${bookId}`);

    return NextResponse.json({
      success: true,
      bookId,
      unitsCreated: units.length,
      lessonsCreated: totalLessons,
      questionsExtracted: totalQuestions,
      message: "Book parsing completed successfully"
    });

  } catch (error) {
    console.error("Error parsing book:", error);
    return NextResponse.json(
      { error: "Failed to parse book" },
      { status: 500 }
    );
  }
}

async function createBookUnits(bookId: string, content: string, bookTitle: string) {
  // Simple heuristic: split content into chunks and create units
  // In production, this would use proper PDF structure detection
  const chunks = splitContentIntoUnits(content);
  const units = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const unitTitle = `Unit ${i + 1}: ${chunk.title || `Chapter ${i + 1}`}`;
    
    const unit = await prisma.bookUnit.create({
      data: {
        bookId,
        title: unitTitle,
        description: chunk.summary || `Content from ${bookTitle} - Unit ${i + 1}`,
        order: i + 1,
        pageRange: chunk.pageRange || `Pages ${i * 20 + 1}-${(i + 1) * 20}`,
        summary: chunk.summary || `This unit covers key concepts from ${bookTitle}`,
        isActive: true
      }
    });

    units.push({
      id: unit.id,
      title: unit.title,
      content: chunk.content,
      order: unit.order
    });
  }

  return units;
}

async function createLessonsForUnit(unitId: string, unitContent: string, unitTitle: string) {
  // Split unit content into lesson-sized chunks
  const lessonChunks = splitContentIntoLessons(unitContent);
  const lessons = [];
  let totalQuestions = 0;

  // Find the book and unit
  const unit = await prisma.bookUnit.findUnique({
    where: { id: unitId },
    include: { 
      book: {
        include: { subject: true }
      }
    }
  });

  if (!unit) {
    throw new Error(`Unit not found: ${unitId}`);
  }

  // Create a topic for this unit if it doesn't exist
  let topic = await prisma.topic.findFirst({
    where: {
      subjectId: unit.book.subjectId,
      name: unitTitle
    }
  });

  if (!topic) {
    topic = await prisma.topic.create({
      data: {
        subjectId: unit.book.subjectId,
        name: unitTitle,
        description: `Topic created from book unit: ${unitTitle}`,
        order: 1,
        isActive: true
      }
    });
  }

  for (let i = 0; i < lessonChunks.length; i++) {
    const chunk = lessonChunks[i];
    const lessonTitle = `Lesson ${i + 1}: ${chunk.title || `Part ${i + 1}`}`;
    
    const lesson = await prisma.lesson.create({
      data: {
        topicId: topic.id,
        title: lessonTitle,
        content: chunk.content,
        objectives: chunk.objectives || [`Learn about ${lessonTitle}`],
        difficulty: "intermediate",
        estimatedTime: chunk.estimatedTime || 30,
        order: i + 1,
        isActive: true,
        bookUnitId: unitId
      }
    });

    // Create a RAG document for this lesson
    await prisma.ragDocument.create({
      data: {
        title: lessonTitle,
        content: chunk.content,
        length: chunk.content.length,
        subject: unit.book.subject.name,
        topic: topic.name,
        difficulty: "intermediate",
        learningStyle: "mixed",
        estimatedTime: chunk.estimatedTime || 30,
        organizationId: unit.book.organizationId,
        bookId: unit.book.id,
        bookUnitId: unitId,
        lessonId: lesson.id
      }
    });

    // Extract questions from lesson content
    try {
      const extractor = new BookQuestionExtractor(chunk.content, unitId, lesson.id, unit.book.language);
      const questionResult = extractor.extractQuestions();
      
      if (questionResult.questions.length > 0) {
        // Create a default assessment for this lesson
        const assessment = await prisma.assessment.create({
          data: {
            lessonId: lesson.id,
            type: 'quiz',
            title: `Practice Questions: ${lessonTitle}`,
            instructions: `Complete the following questions based on ${lessonTitle}`,
            timeLimit: 30,
            passingScore: 0.7,
            maxAttempts: 3,
            isActive: true
          }
        });

        // Store extracted questions
        for (const questionData of questionResult.questions.slice(0, 5)) { // Limit to 5 questions per lesson
          await prisma.question.create({
            data: {
              assessmentId: assessment.id,
              type: questionData.type as any,
              content: questionData.text,
              options: questionData.options && questionData.options.length > 0 ? {
                create: questionData.options.map((opt: string, idx: number) => ({
                  content: opt,
                  isCorrect: questionData.correctAnswer ? opt === questionData.correctAnswer : idx === 0,
                  order: idx + 1
                }))
              } : undefined,
              correctAnswer: questionData.correctAnswer || '',
              explanation: questionData.explanation || '',
              order: 1,
              isActive: true
            }
          });
        }

        totalQuestions += questionResult.questions.length;
        console.log(`✅ [DEBUG] Extracted ${questionResult.questions.length} questions from lesson: ${lessonTitle}`);
      }
    } catch (error) {
      console.warn(`⚠️ [DEBUG] Failed to extract questions from lesson ${lessonTitle}:`, error);
    }

    lessons.push(lesson);
  }

  return { lessons, questions: totalQuestions };
}

function splitContentIntoUnits(content: string) {
  // Enhanced PDF structure detection
  const units = [];
  
  // Look for common book structure patterns
  const chapterPatterns = [
    /^Chapter\s+\d+/gmi,
    /^Unit\s+\d+/gmi,
    /^Section\s+\d+/gmi,
    /^Part\s+\d+/gmi,
    /^\d+\.\s+[A-Z]/gm, // Numbered sections
    /^[A-Z][A-Z\s]+$/gm // All caps headings
  ];
  
  let unitNumber = 1;
  
  // Find all potential chapter/unit markers
  const markers = [];
  for (const pattern of chapterPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      markers.push({
        index: match.index,
        text: match[0],
        pattern: pattern.source
      });
    }
  }
  
  // Sort markers by position
  markers.sort((a, b) => a.index - b.index);
  
  // Create units based on markers
  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i];
    const nextMarker = markers[i + 1];
    const startIndex = marker.index;
    const endIndex = nextMarker ? nextMarker.index : content.length;
    
    const unitContent = content.substring(startIndex, endIndex).trim();
    
    if (unitContent.length > 200) { // Only include substantial content
      units.push({
        title: extractTitle(unitContent) || `Unit ${unitNumber}`,
        content: unitContent,
        summary: extractSummary(unitContent),
        pageRange: estimatePageRange(unitContent, unitNumber)
      });
      unitNumber++;
    }
  }
  
  // If no structure found, split by content length
  if (units.length === 0) {
    const maxChunkSize = 5000;
    const chunks = splitTextIntoChunks(content, maxChunkSize);
    units.push(...chunks);
  }
  
  // Ensure we have at least one unit
  if (units.length === 0) {
    units.push({
      title: "Introduction",
      content: content.substring(0, Math.min(content.length, 5000)),
      summary: "Introduction to the book content",
      pageRange: "Pages 1-20"
    });
  }

  return units.slice(0, 15); // Limit to 15 units for now
}

function splitContentIntoLessons(content: string) {
  // Split content into lesson-sized chunks (15-30 minutes each)
  const maxLessonSize = 2000; // characters
  const chunks = splitTextIntoChunks(content, maxLessonSize);
  
  return chunks.map((chunk, index) => ({
    title: extractTitle(chunk.content) || `Part ${index + 1}`,
    content: chunk.content,
    objectives: [`Learn about ${extractTitle(chunk.content) || `Part ${index + 1}`}`],
    estimatedTime: Math.max(15, Math.min(30, Math.ceil(chunk.content.length / 100)))
  }));
}

function splitTextIntoChunks(text: string, maxSize: number) {
  const chunks = [];
  let currentChunk = '';
  
  const sentences = text.split(/[.!?]+/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxSize && currentChunk.length > 0) {
      chunks.push({
        title: extractTitle(currentChunk),
        content: currentChunk.trim(),
        summary: extractSummary(currentChunk),
        pageRange: null
      });
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '.';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push({
      title: extractTitle(currentChunk),
      content: currentChunk.trim(),
      summary: extractSummary(currentChunk),
      pageRange: null
    });
  }
  
  return chunks;
}

function extractTitle(text: string): string | null {
  // Try to extract a title from the first line or heading
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();
  
  if (firstLine && firstLine.length < 100 && firstLine.length > 5) {
    return firstLine;
  }
  
  // Look for common heading patterns
  const headingMatch = text.match(/^(Chapter \d+|Unit \d+|Section \d+)/i);
  if (headingMatch) {
    return headingMatch[0];
  }
  
  return null;
}

function extractSummary(text: string): string {
  // Extract first sentence or first 100 characters as summary
  const firstSentence = text.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length < 100) {
    return firstSentence.trim();
  }
  
  return text.substring(0, 100).trim() + '...';
}

function estimatePageRange(content: string, unitNumber: number): string {
  // Estimate page range based on content length
  // Roughly 500 words per page, 5 characters per word average
  const estimatedPages = Math.ceil(content.length / 2500);
  const startPage = (unitNumber - 1) * 20 + 1;
  const endPage = startPage + estimatedPages - 1;
  
  return `Pages ${startPage}-${endPage}`;
}
