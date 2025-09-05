"use client";
import React, { useState } from 'react';
import { 
  Brain, Send, Mic, Camera, Paperclip, Volume2, 
  RefreshCw, ThumbsUp, ThumbsDown, BookOpen, 
  Lightbulb, Code, Calculator, Palette, Music,
  Globe, Beaker, History, Heart, Star, Sparkles,
  ChevronRight, Eye, Headphones, PenTool, Video,
  ArrowLeft, Settings, Download, Share2, Bookmark
} from 'lucide-react';

const AITeacherPage = () => {
  const [selectedSubject, setSelectedSubject] = useState('mathematics');
  const [currentTopic, setCurrentTopic] = useState('algebra');
  const [teachingMethod, setTeachingMethod] = useState('visual');
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: "Hello! I'm your AI Teacher. Today we're learning about Quadratic Equations. How would you like me to explain this topic?",
      methods: ['Step-by-Step', 'Visual Diagram', 'Real-World Examples', 'Interactive Practice'],
      timestamp: '2:30 PM'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const subjects = [
    { id: 'mathematics', name: 'Mathematics', icon: Calculator, color: 'from-blue-500 to-indigo-500' },
    { id: 'science', name: 'Science', icon: Beaker, color: 'from-green-500 to-emerald-500' },
    { id: 'history', name: 'History', icon: History, color: 'from-amber-500 to-orange-500' },
    { id: 'languages', name: 'Languages', icon: Globe, color: 'from-purple-500 to-pink-500' },
    { id: 'arts', name: 'Arts', icon: Palette, color: 'from-pink-500 to-rose-500' },
    { id: 'music', name: 'Music', icon: Music, color: 'from-indigo-500 to-purple-500' },
    { id: 'coding', name: 'Coding', icon: Code, color: 'from-gray-600 to-gray-800' },
  ];

  const teachingMethods = [
    { id: 'visual', name: 'Visual', icon: Eye, description: 'Diagrams & Charts' },
    { id: 'audio', name: 'Audio', icon: Headphones, description: 'Narrated Lessons' },
    { id: 'interactive', name: 'Interactive', icon: PenTool, description: 'Hands-on Practice' },
    { id: 'video', name: 'Video', icon: Video, description: 'Video Tutorials' },
  ];

  const currentTopics = [
    { name: 'Quadratic Equations', progress: 75, difficulty: 'Medium' },
    { name: 'Linear Functions', progress: 100, difficulty: 'Easy' },
    { name: 'Trigonometry', progress: 30, difficulty: 'Hard' },
    { name: 'Calculus Basics', progress: 0, difficulty: 'Hard' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-2 rounded-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                    AI Teacher - Interactive Learning
                  </h1>
                  <p className="text-sm text-gray-600">Personalized education adapted to your learning style</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bookmark className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Sidebar - Subjects & Topics */}
          <div className="col-span-3 space-y-4">
            {/* Subject Selection */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Select Subject</h3>
              <div className="space-y-2">
                {subjects.map((subject) => {
                  const IconComponent = subject.icon;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedSubject === subject.id
                          ? 'bg-gradient-to-r ' + subject.color + ' text-white shadow-lg'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{subject.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Topics */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Current Topics</h3>
              <div className="space-y-3">
                {currentTopics.map((topic, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        topic.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        topic.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {topic.difficulty}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-violet-500 to-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${topic.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{topic.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="col-span-6 flex flex-col">
            {/* Teaching Method Selector */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Learning Style</h3>
                <div className="flex gap-2">
                  {teachingMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setTeachingMethod(method.id)}
                        className={`p-2 rounded-lg transition-all group relative ${
                          teachingMethod === method.id
                            ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {method.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 bg-white/80 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg overflow-hidden flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message, idx) => (
                  <div key={idx} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700">AI Teacher</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                      )}
                      
                      <div className={`rounded-xl p-4 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white' 
                          : 'bg-gray-100'
                      }`}>
                        <p className={message.type === 'user' ? 'text-white' : 'text-gray-800'}>
                          {message.content}
                        </p>
                        
                        {message.methods && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.methods.map((method, midx) => (
                              <button
                                key={midx}
                                className="px-3 py-1 bg-white/20 backdrop-blur-lg rounded-lg text-sm hover:bg-white/30 transition-colors border border-white/30"
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {message.type === 'ai' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <ThumbsUp className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <ThumbsDown className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <Volume2 className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Visual Learning Example */}
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl p-6 border border-violet-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Visual Explanation: Quadratic Formula</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-mono mb-4">
                        x = (-b ± √(b² - 4ac)) / 2a
                      </div>
                      <svg className="w-full h-48 mx-auto">
                        <path d="M 50 150 Q 150 50 250 150" stroke="url(#gradient)" strokeWidth="3" fill="none"/>
                        <defs>
                          <linearGradient id="gradient">
                            <stop offset="0%" stopColor="#8B5CF6"/>
                            <stop offset="100%" stopColor="#3B82F6"/>
                          </linearGradient>
                        </defs>
                        <circle cx="50" cy="150" r="5" fill="#8B5CF6"/>
                        <circle cx="150" cy="50" r="5" fill="#3B82F6"/>
                        <circle cx="250" cy="150" r="5" fill="#8B5CF6"/>
                      </svg>
                      <p className="text-sm text-gray-600 mt-4">
                        The parabola shows how the quadratic equation creates a curved path
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Camera className="w-5 h-5 text-gray-500" />
                  </button>
                  
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Ask your AI teacher anything..."
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    />
                  </div>
                  
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-3 rounded-lg transition-all ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  <button className="p-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">Powered by AI</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span className="text-xs text-violet-600">Adaptive responses based on your learning style</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Learning Tools */}
          <div className="col-span-3 space-y-4">
            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-all">
                  <Lightbulb className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Get a Hint</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-all">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Show Examples</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Different Explanation</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg hover:from-amber-100 hover:to-orange-100 transition-all">
                  <Download className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Download Notes</span>
                </button>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Today&apos;s Progress</h3>
                <Star className="w-5 h-5" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Questions Answered</span>
                    <span>12/15</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2 w-4/5 transition-all"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mastery Level</span>
                    <span>Advanced</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 h-2 rounded-full ${
                          level <= 4 ? 'bg-white' : 'bg-white/30'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition-all border border-white/30">
                View Detailed Report
              </button>
            </div>

            {/* Upcoming Assessment */}
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Next Assessment</h3>
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700">Algebra Quiz</span>
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">Tomorrow</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Covers: Quadratic equations, factoring, and graphing</p>
                <button className="text-sm text-amber-700 font-medium hover:text-amber-800 transition-colors flex items-center gap-1">
                  Start Practice Session
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITeacherPage;
