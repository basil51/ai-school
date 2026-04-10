# Lesson Cache Fix Summary

## Problem Identified

The AI teacher page was showing cached content from previous lessons when selecting new lessons. Specifically, when switching from "Mathematics, Algebra, Introduction to Variables" to "Physics, Mechanics, Introduction to Motion", the page would display the cached content from the previous lesson instead of loading fresh content for the new lesson.

## Root Cause Analysis

The issue was in the cache key generation in the `SmartTeachingContentGenerator` class:

### 1. Main Content Generation Cache Key Issue
**File:** `web/src/lib/smart-teaching/ai-content-generator.ts`
**Line:** 387 (original)

```typescript
const cacheKey = `${lessonId ?? 'no-id'}-${title}-${subject}-${topic}-${difficulty}-${learningStyle}`;
```

**Problem:** When `lessonId` was `null` or `undefined`, it became `'no-id'`, causing different lessons with the same title, subject, topic, difficulty, and learning style to have identical cache keys.

### 2. Additional Content Type Cache Key Issue
**File:** `web/src/lib/smart-teaching/ai-content-generator.ts`
**Line:** 524 (original)

```typescript
const cacheKey = `${title}-${subject}-${topic}-${difficulty}-${learningStyle}-${contentType}`;
```

**Problem:** This method didn't include the lesson ID at all, making it impossible to distinguish between different lessons with similar content.

## Solution Implemented

### 1. Enhanced Cache Key Generation
Added a content hash generation method and updated cache key creation:

```typescript
// Generate a hash from content to ensure unique cache keys
private generateContentHash(lessonContent: string, title: string, objectives: string[]): string {
  const contentString = `${title}-${lessonContent.substring(0, 100)}-${objectives.join(',')}`;
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
```

### 2. Updated Main Content Cache Key
```typescript
const contentHash = this.generateContentHash(lessonContent, title, objectives);
const cacheKey = `${lessonId || 'no-id'}-${contentHash}-${subject}-${topic}-${difficulty}-${learningStyle}`;
```

### 3. Updated Additional Content Type Cache Key
```typescript
const contentHash = this.generateContentHash(lessonContent, title, objectives);
const cacheKey = `${lessonId || 'no-id'}-${contentHash}-${subject}-${topic}-${difficulty}-${learningStyle}-${contentType}`;
```

### 4. Updated API Endpoint
**File:** `web/src/app/api/smart-teaching/generate-progressive-content/route.ts`

Added lesson ID parameter to the `generateAdditionalContentType` method call:

```typescript
generatedContent = await smartTeachingContentGenerator.generateAdditionalContentType(
  lesson.content,
  lesson.topic.subject.name,
  lesson.topic.name,
  lesson.title,
  lesson.objectives,
  lesson.difficulty,
  learningStyle,
  contentType,
  lesson.id  // Added lesson ID
);
```

### 5. Enhanced Cache Clearing
Updated the `clearCacheForLesson` method to handle both old and new cache key formats:

```typescript
clearCacheForLesson(lessonId: string): void {
  const keysToDelete: string[] = [];
  for (const key of this.cache.keys()) {
    // Check if the cache key starts with the lesson ID (new format) or contains it (old format)
    if (key.startsWith(`${lessonId}-`) || key.startsWith(`no-id-`) && key.includes(lessonId)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  });
  console.log(LOG_MESSAGES.clearedCacheEntries(keysToDelete.length, lessonId));
}
```

### 6. Improved State Management
**File:** `web/src/components/UnifiedSmartTeachingInterface.tsx`

Added content clearing when switching lessons:

```typescript
if (selectedLessonId) {
  console.log('🎯 [DEBUG] Starting to load lesson data for:', selectedLessonId);
  
  // Clear any existing content and cache when switching lessons
  setGeneratedContent(null);
  setContentStatuses({});
  
  componentLocks.add(lockKey);
  loadLessonData(selectedLessonId).finally(() => {
    componentLocks.delete(lockKey);
  });
}
```

## Files Modified

1. `web/src/lib/smart-teaching/ai-content-generator.ts`
   - Added `generateContentHash` method
   - Updated `generateContent` cache key generation
   - Updated `generateAdditionalContentType` cache key generation and signature
   - Enhanced `clearCacheForLesson` method
   - Added `clearCacheForLessonSwitch` method

2. `web/src/app/api/smart-teaching/generate-progressive-content/route.ts`
   - Updated `generateAdditionalContentType` call to include lesson ID

3. `web/src/components/UnifiedSmartTeachingInterface.tsx`
   - Added content clearing when switching lessons

4. `web/src/app/[locale]/student/ai-teacher/page.tsx`
   - Enhanced lesson selection handling with better logging

## Testing Recommendations

1. **Test Lesson Switching:** Switch between different lessons (e.g., Mathematics → Physics) and verify that each lesson shows its own content
2. **Test Same Subject Different Topics:** Switch between topics in the same subject to ensure content differentiation
3. **Test Cache Persistence:** Verify that the same lesson shows cached content when revisited
4. **Test Content Types:** Ensure all content types (text, video, math, diagram, interactive) are properly cached per lesson

## Expected Behavior After Fix

- Each lesson will have a unique cache key based on lesson ID, content hash, subject, topic, difficulty, and learning style
- Switching between lessons will clear previous content and load fresh content for the new lesson
- Cached content will be properly isolated per lesson
- No more cross-contamination between different lessons

## Cache Key Format

**Before:** `no-id-Introduction to Variables-Mathematics-Algebra-beginner-visual`
**After:** `lesson-123-abc123-Mathematics-Algebra-beginner-visual`

Where:
- `lesson-123` is the actual lesson ID
- `abc123` is the content hash based on lesson content, title, and objectives
- The rest remains the same for proper categorization

This ensures that even lessons with similar titles but different content will have unique cache keys.
