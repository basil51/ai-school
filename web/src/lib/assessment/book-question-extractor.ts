interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false' | 'fill_in_blank';
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pageReference?: string;
  unitId?: string;
  lessonId?: string;
  language?: string;
}

interface AssessmentExtractionResult {
  questions: Question[];
  totalFound: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
}

export class BookQuestionExtractor {
  private content: string;
  private unitId?: string;
  private lessonId?: string;
  private language: string;

  constructor(content: string, unitId?: string, lessonId?: string, language: string = 'en') {
    this.content = content;
    this.unitId = unitId;
    this.lessonId = lessonId;
    this.language = this.detectLanguage(content) || language;
  }

  extractQuestions(): AssessmentExtractionResult {
    const questions: Question[] = [];
    
    // Extract different types of questions
    questions.push(...this.extractMultipleChoiceQuestions());
    questions.push(...this.extractTrueFalseQuestions());
    questions.push(...this.extractShortAnswerQuestions());
    questions.push(...this.extractEssayQuestions());
    questions.push(...this.extractFillInBlankQuestions());

    // Categorize results
    const byType = questions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byDifficulty = questions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      questions,
      totalFound: questions.length,
      byType,
      byDifficulty
    };
  }

  private extractMultipleChoiceQuestions(): Question[] {
    const questions: Question[] = [];
    
    // Get language-specific patterns
    const patterns = this.getMultipleChoicePatterns();

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const questionText = match[1]?.trim();
        if (!questionText || questionText.length < 10) continue;

        const options: string[] = [];
        const correctAnswer = '';

        // Extract options based on pattern
        if (match[2]?.includes(')')) {
          // Format: A) Option 1, B) Option 2, etc.
          for (let i = 2; i < match.length; i += 2) {
            if (match[i] && match[i + 1]) {
              options.push(match[i + 1].trim());
            }
          }
        } else if (match[2]?.includes('.')) {
          // Format: 1. Option 1, 2. Option 2, etc.
          for (let i = 2; i < match.length; i++) {
            if (match[i]) {
              options.push(match[i].trim());
            }
          }
        }

        if (options.length >= 2) {
          questions.push({
            id: this.generateQuestionId(),
            text: questionText,
            type: 'multiple_choice',
            options,
            correctAnswer: correctAnswer || options[0], // Default to first option
            difficulty: this.assessDifficulty(questionText),
            pageReference: this.extractPageReference(match.index),
            unitId: this.unitId,
            lessonId: this.lessonId,
            language: this.language
          });
        }
      }
    });

    return questions;
  }

  private extractTrueFalseQuestions(): Question[] {
    const questions: Question[] = [];
    
    // Get language-specific patterns
    const patterns = this.getTrueFalsePatterns();

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const questionText = match[1]?.trim();
        if (!questionText || questionText.length < 10) continue;

        questions.push({
          id: this.generateQuestionId(),
          text: questionText,
          type: 'true_false',
          options: this.language === 'ar' ? ['صحيح', 'خطأ'] : this.language === 'he' ? ['נכון', 'לא נכון'] : ['True', 'False'],
          correctAnswer: this.language === 'ar' ? 'صحيح' : this.language === 'he' ? 'נכון' : 'True', // Default, would need manual review
          difficulty: this.assessDifficulty(questionText),
          pageReference: this.extractPageReference(match.index),
          unitId: this.unitId,
          lessonId: this.lessonId,
          language: this.language
        });
      }
    });

    return questions;
  }

  private extractShortAnswerQuestions(): Question[] {
    const questions: Question[] = [];
    
    // Get language-specific patterns
    const patterns = this.getShortAnswerPatterns();

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const questionText = match[1]?.trim();
        if (!questionText || questionText.length < 15) continue;

        questions.push({
          id: this.generateQuestionId(),
          text: questionText,
          type: 'short_answer',
          difficulty: this.assessDifficulty(questionText),
          pageReference: this.extractPageReference(match.index),
          unitId: this.unitId,
          lessonId: this.lessonId,
          language: this.language
        });
      }
    });

    return questions;
  }

  private extractEssayQuestions(): Question[] {
    const questions: Question[] = [];
    
    // Get language-specific patterns
    const patterns = this.getEssayPatterns();

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const questionText = match[1]?.trim();
        if (!questionText || questionText.length < 20) continue;

        questions.push({
          id: this.generateQuestionId(),
          text: questionText,
          type: 'essay',
          difficulty: this.assessDifficulty(questionText),
          pageReference: this.extractPageReference(match.index),
          unitId: this.unitId,
          lessonId: this.lessonId,
          language: this.language
        });
      }
    });

    return questions;
  }

  private extractFillInBlankQuestions(): Question[] {
    const questions: Question[] = [];
    
    // Get language-specific patterns
    const patterns = this.getFillInBlankPatterns();

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(this.content)) !== null) {
        const questionText = match[1]?.trim();
        if (!questionText || questionText.length < 15) continue;

        questions.push({
          id: this.generateQuestionId(),
          text: questionText,
          type: 'fill_in_blank',
          difficulty: this.assessDifficulty(questionText),
          pageReference: this.extractPageReference(match.index),
          unitId: this.unitId,
          lessonId: this.lessonId,
          language: this.language
        });
      }
    });

    return questions;
  }

  private assessDifficulty(text: string): 'beginner' | 'intermediate' | 'advanced' {
    const lowerText = text.toLowerCase();
    
    // Advanced indicators
    if (lowerText.includes('analyze') || lowerText.includes('evaluate') || 
        lowerText.includes('synthesize') || lowerText.includes('critique') ||
        lowerText.includes('compare and contrast') || lowerText.includes('discuss')) {
      return 'advanced';
    }
    
    // Intermediate indicators
    if (lowerText.includes('explain') || lowerText.includes('describe') ||
        lowerText.includes('how does') || lowerText.includes('why does')) {
      return 'intermediate';
    }
    
    // Beginner indicators
    if (lowerText.includes('what is') || lowerText.includes('define') ||
        lowerText.includes('identify') || lowerText.includes('list')) {
      return 'beginner';
    }
    
    // Default to intermediate
    return 'intermediate';
  }

  private extractPageReference(index: number): string {
    // Estimate page based on content position
    const charsPerPage = 2500; // Rough estimate
    const estimatedPage = Math.ceil(index / charsPerPage);
    return `Page ${estimatedPage}`;
  }

  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Language-specific pattern methods
  private getMultipleChoicePatterns(): RegExp[] {
    switch (this.language) {
      case 'ar':
        return [
          // Arabic: "السؤال؟\nأ) الخيار الأول\nب) الخيار الثاني\nج) الخيار الثالث\nد) الخيار الرابع"
          /([^.!?]*[؟؟])\s*\n\s*([أ-د])\)\s*([^\n]+)\s*\n\s*([أ-د])\)\s*([^\n]+)\s*\n\s*([أ-د])\)\s*([^\n]+)\s*\n\s*([أ-د])\)\s*([^\n]+)/gi,
          // Arabic numbered: "السؤال؟\n1. الخيار الأول\n2. الخيار الثاني\n3. الخيار الثالث\n4. الخيار الرابع"
          /([^.!?]*[؟؟])\s*\n\s*1\.\s*([^\n]+)\s*\n\s*2\.\s*([^\n]+)\s*\n\s*3\.\s*([^\n]+)\s*\n\s*4\.\s*([^\n]+)/gi,
          // Arabic with Arabic numerals: "السؤال؟\n١. الخيار الأول\n٢. الخيار الثاني\n٣. الخيار الثالث\n٤. الخيار الرابع"
          /([^.!?]*[؟؟])\s*\n\s*[١-٤]\.\s*([^\n]+)\s*\n\s*[١-٤]\.\s*([^\n]+)\s*\n\s*[١-٤]\.\s*([^\n]+)\s*\n\s*[١-٤]\.\s*([^\n]+)/gi
        ];
      case 'he':
        return [
          // Hebrew: "השאלה?\nא) האפשרות הראשונה\nב) האפשרות השנייה\nג) האפשרות השלישית\nד) האפשרות הרביעית"
          /([^.!?]*[?؟])\s*\n\s*([א-ד])\)\s*([^\n]+)\s*\n\s*([א-ד])\)\s*([^\n]+)\s*\n\s*([א-ד])\)\s*([^\n]+)\s*\n\s*([א-ד])\)\s*([^\n]+)/gi,
          // Hebrew numbered: "השאלה?\n1. האפשרות הראשונה\n2. האפשרות השנייה\n3. האפשרות השלישית\n4. האפשרות הרביעית"
          /([^.!?]*[?؟])\s*\n\s*1\.\s*([^\n]+)\s*\n\s*2\.\s*([^\n]+)\s*\n\s*3\.\s*([^\n]+)\s*\n\s*4\.\s*([^\n]+)/gi
        ];
      default:
        // English and other LTR languages
        return [
          // Standard format: "Question text?\nA) Option 1\nB) Option 2\nC) Option 3\nD) Option 4"
          /([^.!?]*\?)\s*\n\s*([A-D])\)\s*([^\n]+)\s*\n\s*([A-D])\)\s*([^\n]+)\s*\n\s*([A-D])\)\s*([^\n]+)\s*\n\s*([A-D])\)\s*([^\n]+)/gi,
          // Alternative format: "Question text?\n1. Option 1\n2. Option 2\n3. Option 3\n4. Option 4"
          /([^.!?]*\?)\s*\n\s*1\.\s*([^\n]+)\s*\n\s*2\.\s*([^\n]+)\s*\n\s*3\.\s*([^\n]+)\s*\n\s*4\.\s*([^\n]+)/gi,
          // Simple format: "Question text?\nA. Option 1\nB. Option 2\nC. Option 3\nD. Option 4"
          /([^.!?]*\?)\s*\n\s*([A-D])\.\s*([^\n]+)\s*\n\s*([A-D])\.\s*([^\n]+)\s*\n\s*([A-D])\.\s*([^\n]+)\s*\n\s*([A-D])\.\s*([^\n]+)/gi
        ];
    }
  }

  private getTrueFalsePatterns(): RegExp[] {
    switch (this.language) {
      case 'ar':
        return [
          // Arabic: "البيان. صحيح/خطأ"
          /([^.!?]*[.!?])\s*(?:صحيح\/خطأ|ص\/خ|صحيح أو خطأ)/gi,
          // Arabic: "البيان؟\nصحيح\nخطأ"
          /([^.!?]*[؟؟])\s*\n\s*صحيح\s*\n\s*خطأ/gi
        ];
      case 'he':
        return [
          // Hebrew: "הטענה. נכון/לא נכון"
          /([^.!?]*[.!?])\s*(?:נכון\/לא נכון|נ\/ל|נכון או לא נכון)/gi,
          // Hebrew: "הטענה?\nנכון\nלא נכון"
          /([^.!?]*[?؟])\s*\n\s*נכון\s*\n\s*לא נכון/gi
        ];
      default:
        return [
          // English: "Statement. True/False"
          /([^.!?]*[.!?])\s*(?:True\/False|T\/F|True or False)/gi,
          // English: "Statement?\nTrue\nFalse"
          /([^.!?]*\?)\s*\n\s*True\s*\n\s*False/gi
        ];
    }
  }

  private getShortAnswerPatterns(): RegExp[] {
    switch (this.language) {
      case 'ar':
        return [
          // Arabic question words
          /(ما\s+هو\s+[^.!?]*[.!?]|ما\s+هي\s+[^.!?]*[.!?]|عرف\s+[^.!?]*[.!?]|اشرح\s+[^.!?]*[.!?]|كيف\s+[^.!?]*[.!?]|لماذا\s+[^.!?]*[.!?])/gi,
          // Arabic: "أكمل التالي: ..."
          /(أكمل\s+التالي[^.!?]*[.!?])/gi
        ];
      case 'he':
        return [
          // Hebrew question words
          /(מה\s+הוא\s+[^.!?]*[.!?]|מה\s+היא\s+[^.!?]*[.!?]|הגדר\s+[^.!?]*[.!?]|הסבר\s+[^.!?]*[.!?]|איך\s+[^.!?]*[.!?]|למה\s+[^.!?]*[.!?])/gi,
          // Hebrew: "השלם את הבא: ..."
          /(השלם\s+את\s+הבא[^.!?]*[.!?])/gi
        ];
      default:
        return [
          // English question words
          /(What\s+is\s+[^.!?]*[.!?]|Define\s+[^.!?]*[.!?]|Explain\s+[^.!?]*[.!?]|How\s+does\s+[^.!?]*[.!?]|Why\s+[^.!?]*[.!?])/gi,
          // English: "Complete the following: ..."
          /(Complete\s+the\s+following[^.!?]*[.!?])/gi
        ];
    }
  }

  private getEssayPatterns(): RegExp[] {
    switch (this.language) {
      case 'ar':
        return [
          // Arabic essay prompts
          /(ناقش\s+[^.!?]*[.!?]|حلل\s+[^.!?]*[.!?]|قارن\s+و\s+قارن\s+[^.!?]*[.!?]|قيم\s+[^.!?]*[.!?]|اكتب\s+مقال\s+حول\s+[^.!?]*[.!?])/gi
        ];
      case 'he':
        return [
          // Hebrew essay prompts
          /(דון\s+[^.!?]*[.!?]|נתח\s+[^.!?]*[.!?]|השווה\s+[^.!?]*[.!?]|הערך\s+[^.!?]*[.!?]|כתוב\s+מאמר\s+על\s+[^.!?]*[.!?])/gi
        ];
      default:
        return [
          // English essay prompts
          /(Discuss\s+[^.!?]*[.!?]|Analyze\s+[^.!?]*[.!?]|Compare\s+and\s+contrast\s+[^.!?]*[.!?]|Evaluate\s+[^.!?]*[.!?]|Write\s+(?:an\s+essay\s+on|about)\s+[^.!?]*[.!?])/gi
        ];
    }
  }

  private getFillInBlankPatterns(): RegExp[] {
    switch (this.language) {
      case 'ar':
        return [
          // Arabic fill-in-the-blank
          /(أكمل[^.!?]*[.!?])/gi,
          /(املأ\s+الفراغ[^.!?]*[.!?])/gi,
          /([^.!?]*___[^.!?]*[.!?])/gi
        ];
      case 'he':
        return [
          // Hebrew fill-in-the-blank
          /(השלם[^.!?]*[.!?])/gi,
          /(מלא\s+את\s+החסר[^.!?]*[.!?])/gi,
          /([^.!?]*___[^.!?]*[.!?])/gi
        ];
      default:
        return [
          // English fill-in-the-blank
          /(Complete[^.!?]*[.!?])/gi,
          /(Fill\s+in\s+the\s+blank[^.!?]*[.!?])/gi,
          /([^.!?]*_[^.!?]*[.!?])/gi
        ];
    }
  }

  // Language detection method
  private detectLanguage(text: string): string | null {
    if (!text || text.length < 50) return null;
    
    // Simple language detection based on character sets
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const hebrewPattern = /[\u0590-\u05FF\u200F\u202B\u202E]/g;
    const englishPattern = /[a-zA-Z]/g;
    
    const arabicMatches = (text.match(arabicPattern) || []).length;
    const hebrewMatches = (text.match(hebrewPattern) || []).length;
    const englishMatches = (text.match(englishPattern) || []).length;
    
    const total = arabicMatches + hebrewMatches + englishMatches;
    if (total === 0) return null;
    
    // Return language with highest character count
    if (arabicMatches > hebrewMatches && arabicMatches > englishMatches) {
      return 'ar';
    } else if (hebrewMatches > arabicMatches && hebrewMatches > englishMatches) {
      return 'he';
    } else if (englishMatches > arabicMatches && englishMatches > hebrewMatches) {
      return 'en';
    }
    
    return null;
  }
}

export type { Question, AssessmentExtractionResult };
