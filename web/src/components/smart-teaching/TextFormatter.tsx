"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Volume2, VolumeX, Maximize2, 
  Minimize2, RotateCcw, Settings, Type, AlignLeft, 
  AlignCenter, AlignRight, Plus, Minus, Sun, Moon,
  Bookmark, BookmarkCheck, ArrowRight, 
  Target, Clock, Brain, Sparkles, CheckCircle
} from 'lucide-react';

interface TextFormatterProps {
  content: {
    title?: string;
    text?: string;
    objectives?: string[];
    subject?: string;
    topic?: string;
    difficulty?: string;
    estimatedTime?: number;
    narration?: string;
  };
  learningStyle?: 'visual' | 'audio' | 'kinesthetic' | 'analytical';
  onProgress?: (progress: number) => void;
  onBookmark?: (section: string) => void;
  onHighlight?: (text: string) => void;
}

interface ReadingProgress {
  currentSection: number;
  totalSections: number;
  wordsRead: number;
  totalWords: number;
  timeSpent: number;
  comprehensionScore: number;
}

const TextFormatter: React.FC<TextFormatterProps> = ({
  content,
  //learningStyle = 'visual',
  onProgress,
  onBookmark,
  onHighlight
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'justify'>('left');
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [showSettings, setShowSettings] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>({
    currentSection: 0,
    totalSections: 0,
    wordsRead: 0,
    totalWords: 0,
    timeSpent: 0,
    comprehensionScore: 0
  });
  const [bookmarkedSections, setBookmarkedSections] = useState<Set<number>>(new Set());
  const [highlightedText, setHighlightedText] = useState<string>('');
  const showObjectives=true;
  const showProgress=true;
  
  const textRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse and structure the text content
  const parseTextContent = (text: string) => {
    if (!text) return [];
    
    const sections = text.split(/\n\s*\n/).filter(section => section.trim());
    return sections.map((section, index) => {
      const trimmed = section.trim();
      
      // Detect headings (lines that are shorter and don't end with punctuation)
      const isHeading = trimmed.length < 100 && 
                       !trimmed.endsWith('.') && 
                       !trimmed.endsWith('!') && 
                       !trimmed.endsWith('?') &&
                       (trimmed.includes(':') || trimmed.split(' ').length <= 8);
      
      // Detect lists
      const isList = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
      
      // Detect key concepts (words in quotes or bold indicators)
      const keyConcepts = trimmed.match(/"[^"]*"/g) || [];
      
      return {
        id: index,
        type: isHeading ? 'heading' : isList ? 'list' : 'paragraph',
        content: trimmed,
        keyConcepts,
        wordCount: trimmed.split(/\s+/).length
      };
    });
  };

  const structuredContent = parseTextContent(content.text || '');
  const totalWords = structuredContent.reduce((sum, section) => sum + section.wordCount, 0);

  // Update reading progress
  useEffect(() => {
    setReadingProgress(prev => ({
      ...prev,
      totalSections: structuredContent.length,
      totalWords
    }));

    // Start reading timer
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setReadingProgress(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [structuredContent.length, totalWords]);

  // Track reading progress based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!textRef.current) return;
      
      const element = textRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      setReadingProgress(prev => ({
        ...prev,
        wordsRead: Math.floor((progress / 100) * totalWords)
      }));
      
      if (onProgress) {
        onProgress(progress);
      }
    };

    const element = textRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [totalWords, onProgress]);

  const handleBookmark = (sectionId: number) => {
    const newBookmarks = new Set(bookmarkedSections);
    if (newBookmarks.has(sectionId)) {
      newBookmarks.delete(sectionId);
    } else {
      newBookmarks.add(sectionId);
    }
    setBookmarkedSections(newBookmarks);
    
    if (onBookmark) {
      onBookmark(`Section ${sectionId + 1}`);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setHighlightedText(selection.toString().trim());
      if (onHighlight) {
        onHighlight(selection.toString().trim());
      }
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return {
          container: 'bg-gray-900 text-gray-100',
          content: 'bg-gray-800 text-gray-100',
          heading: 'text-blue-300',
          accent: 'text-yellow-400',
          border: 'border-gray-700'
        };
      case 'sepia':
        return {
          container: 'bg-amber-50 text-amber-900',
          content: 'bg-amber-100 text-amber-900',
          heading: 'text-amber-800',
          accent: 'text-amber-700',
          border: 'border-amber-300'
        };
      default:
        return {
          container: 'bg-white text-gray-900',
          content: 'bg-gray-50 text-gray-900',
          heading: 'text-blue-600',
          accent: 'text-blue-500',
          border: 'border-gray-200'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const renderSection = (section: any) => {
    const isBookmarked = bookmarkedSections.has(section.id);
    
    switch (section.type) {
      case 'heading':
        return (
          <div key={section.id} className="relative group">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold ${themeClasses.heading} leading-tight`}>
                {section.content}
              </h2>
              <button
                onClick={() => handleBookmark(section.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ${
                  isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this section'}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      
      case 'list':
        const listItems = section.content.split('\n').filter((item: string) => item.trim());
        return (
          <div key={section.id} className="relative group mb-6">
            <div className="flex items-start justify-between">
              <ul className="space-y-2 flex-1">
                {listItems.map((item: string, itemIndex: number) => (
                  <li key={itemIndex} className={`flex items-start space-x-3 ${themeClasses.container}`}>
                    <div className={`w-2 h-2 rounded-full mt-3 flex-shrink-0 ${themeClasses.accent} bg-current`} />
                    <span className="leading-relaxed">{item.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '')}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleBookmark(section.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ml-4 ${
                  isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this section'}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      
      default:
        return (
          <div key={section.id} className="relative group mb-6">
            <div className="flex items-start justify-between">
              <p 
                className={`leading-relaxed flex-1 ${themeClasses.container}`}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: lineHeight,
                  textAlign: textAlign
                }}
              >
                {section.content}
              </p>
              <button
                onClick={() => handleBookmark(section.id)}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ml-4 ${
                  isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Bookmark this section'}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const readingSpeed = readingProgress.timeSpent > 0 ? 
    Math.round((readingProgress.wordsRead / readingProgress.timeSpent) * 60) : 0;

  return (
    <div className={`h-full flex flex-col ${themeClasses.container} transition-colors duration-300`}>
      {/* Header */}
      <div className={`flex-shrink-0 p-4 border-b ${themeClasses.border} bg-white/90 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BookOpen className={`w-5 h-5 ${themeClasses.accent}`} />
              <h1 className={`text-xl font-bold ${themeClasses.heading}`}>
                {content.title || 'Learning Content'}
              </h1>
            </div>
            
            {content.subject && content.topic && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {content.subject}
                </span>
                <ArrowRight className="w-3 h-3" />
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {content.topic}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Reading Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Learning Objectives */}
        {showObjectives && content.objectives && content.objectives.length > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Learning Objectives</h3>
            </div>
            <ul className="space-y-1">
              {content.objectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                  <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`flex-shrink-0 p-4 border-b ${themeClasses.border} bg-gray-50`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Font Size</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm w-8 text-center">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Line Height</label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLineHeight(Math.max(1.2, lineHeight - 0.1))}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm w-8 text-center">{lineHeight.toFixed(1)}</span>
                <button
                  onClick={() => setLineHeight(Math.min(2.0, lineHeight + 0.1))}
                  className="p-1 rounded hover:bg-gray-200"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Alignment</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`p-1 rounded ${textAlign === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                >
                  <AlignLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`p-1 rounded ${textAlign === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                >
                  <AlignCenter className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setTextAlign('justify')}
                  className={`p-1 rounded ${textAlign === 'justify' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                >
                  <AlignRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Theme */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1 rounded ${theme === 'light' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                  title="Light Theme"
                >
                  <Sun className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1 rounded ${theme === 'dark' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                  title="Dark Theme"
                >
                  <Moon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setTheme('sepia')}
                  className={`p-1 rounded ${theme === 'sepia' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
                  title="Sepia Theme"
                >
                  <Type className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reading Progress */}
      {showProgress && (
        <div className={`flex-shrink-0 p-3 border-b ${themeClasses.border} bg-gradient-to-r from-green-50 to-blue-50`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">
                  {readingProgress.wordsRead} / {readingProgress.totalWords} words
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-green-700">{formatTime(readingProgress.timeSpent)}</span>
              </div>
              {readingSpeed > 0 && (
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-700">{readingSpeed} wpm</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(readingProgress.wordsRead / readingProgress.totalWords) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-600">
                {Math.round((readingProgress.wordsRead / readingProgress.totalWords) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={textRef}
        className={`flex-1 overflow-y-auto p-6 ${themeClasses.content} transition-colors duration-300`}
        onMouseUp={handleTextSelection}
      >
        {structuredContent.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            {structuredContent.map((section) => renderSection(section))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Content Available</h3>
              <p className="text-gray-500">The lesson content is being prepared...</p>
            </div>
          </div>
        )}
      </div>

      {/* Audio Controls */}
      {audioEnabled && content.narration && (
        <div className={`flex-shrink-0 p-4 border-t ${themeClasses.border} bg-white/90 backdrop-blur-sm`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-2 rounded-full transition-colors ${
                  audioEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <span className="text-sm text-gray-600">Audio narration available</span>
            </div>
            
            {highlightedText && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Selected: "{highlightedText}"</span>
                <button
                  onClick={() => setHighlightedText('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextFormatter;
