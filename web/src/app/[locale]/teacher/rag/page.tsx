"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Search, AlertCircle, BookOpen, Brain, Target, Clock, Palette, CheckCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "@/lib/useTranslations";

export default function RagPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { dict } = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [mode, setMode] = useState<"hybrid" | "vector">("hybrid");
  const [alpha, setAlpha] = useState<number>(0.5);
  
  // New form fields for curriculum structure
  const [formData, setFormData] = useState({
    title: "",
    subjectId: "",
    topicId: "",
    difficulty: "beginner",
    learningStyle: "visual",
    estimatedTime: 30
  });

  // State for dropdowns
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Check if user has permission to access this page
  useEffect(() => {
    if (status === "loading") return;
    if (!session || ((session as any).role !== "teacher" && (session as any).role !== "admin")) {
      router.push(`/${locale}/dashboard`);
    }
  }, [session, status, router, locale]);

  // Fetch subjects and topics
  useEffect(() => {
    if (session) {
      fetchSubjects();
    }
  }, [session]);

  const fetchSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const response = await fetch('/api/curriculum/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setFormData({...formData, subjectId, topicId: ""});
    const selectedSubject = subjects.find(s => s.id === subjectId);
    setTopics(selectedSubject?.topics || []);
  };

  async function handleUpload() {
    if (!file || !formData.title || !formData.subjectId || !formData.topicId) {
      setUploadStatus("Please fill in all required fields: title, subject, and topic");
      return;
    }
    
    setUploadLoading(true);
    setUploadStatus("Uploading and processing your educational material...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", formData.title);
    fd.append("subjectId", formData.subjectId);
    fd.append("topicId", formData.topicId);
    fd.append("difficulty", formData.difficulty);
    fd.append("learningStyle", formData.learningStyle);
    fd.append("estimatedTime", formData.estimatedTime.toString());
    
    try {
      const res = await fetch("/api/curriculum/upload-lesson", { method: "POST", body: fd });
      const data = await res.json();
      
      if (res.ok) {
        setUploadStatus("✅ Lesson created successfully! Adding to curriculum...");
        
        // Server handles RAG ingestion automatically
        setUploadStatus(`🎉 Success! Your lesson "${data.lesson.title}" has been added to the ${data.lesson.subject} curriculum under topic "${data.lesson.topic}". Students can now access it in their AI learning interface!`);
        
        // Reset form
        setFile(null);
        setFormData({
          title: "",
          subjectId: "",
          topicId: "",
          difficulty: "beginner",
          learningStyle: "visual",
          estimatedTime: 30
        });
        setTopics([]);
      } else {
        setUploadStatus(`❌ Upload failed: ${data.error}`);
      }
    } catch (error) {
      setUploadStatus("❌ Upload failed. Please check your connection and try again.");
      console.error("Upload failed:", error);
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleAsk() {
    if (!question.trim()) return;
    
    setLoading(true);
    setAnswer("");
    
    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, k: 5, mode, alpha }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAnswer(JSON.stringify(data.snippets, null, 2));
      } else {
        setAnswer(`${dict?.rag?.error || "Error"}: ${data.error}`);
      }
    } catch (error) {
      setAnswer(dict?.rag?.failedToProcessQuery || "Failed to process query");
      console.error("Query failed:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{dict?.rag?.loading || "Loading..."}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || ((session as any).role !== "teacher" && (session as any).role !== "admin")) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">{dict?.rag?.accessDenied || "Access denied. Redirecting..."}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Curriculum Builder
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create structured lessons that students can access through the AI learning interface
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Teacher Portal
            </Badge>
            <Badge variant="outline" className="bg-white">
              <BookOpen className="h-3 w-3 mr-1" />
              {dict?.roles?.[(session as any).role] || (session as any).role}
            </Badge>
          </div>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="h-6 w-6" />
                Create Lesson
              </CardTitle>
              <CardDescription className="text-blue-100">
                Upload teaching materials to create structured lessons in the curriculum
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Teaching Material
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Input
                    id="file"
                    type="file"
                    accept=".txt,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    {file ? (
                      <div className="text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="h-8 w-8 mx-auto mb-2" />
                        <p className="font-medium">Click to upload teaching material</p>
                        <p className="text-sm">Supports .txt and .pdf files</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Content Details Form */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Lesson Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Introduction to Linear Equations"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subject *
                    </Label>
                    <Select 
                      value={formData.subjectId} 
                      onValueChange={handleSubjectChange}
                      disabled={loadingSubjects}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={loadingSubjects ? "Loading subjects..." : "Select a subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Topic *
                    </Label>
                    <Select 
                      value={formData.topicId} 
                      onValueChange={(value) => setFormData({...formData, topicId: value})}
                      disabled={!formData.subjectId || topics.length === 0}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={
                          !formData.subjectId 
                            ? "Select a subject first" 
                            : topics.length === 0 
                              ? "No topics available" 
                              : "Select a topic"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Difficulty Level</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Estimated Time (minutes)
                    </Label>
                    <Input
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value) || 30})}
                      min="5"
                      max="180"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Learning Style
                  </Label>
                  <Select value={formData.learningStyle} onValueChange={(value) => setFormData({...formData, learningStyle: value})}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visual">Visual (Diagrams, Charts, Images)</SelectItem>
                      <SelectItem value="audio">Audio (Narration, Discussions)</SelectItem>
                      <SelectItem value="kinesthetic">Kinesthetic (Interactive, Hands-on)</SelectItem>
                      <SelectItem value="analytical">Analytical (Step-by-step, Logical)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!file || !formData.title || !formData.subjectId || !formData.topicId || uploadLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding to Curriculum...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Add to Curriculum
                  </>
                )}
              </Button>
              
              {uploadStatus && (
                <Alert className={`${uploadStatus.includes('✅') || uploadStatus.includes('🎉') ? 'border-green-200 bg-green-50' : uploadStatus.includes('❌') ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{uploadStatus}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Query Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="h-6 w-6" />
                Test AI Learning
              </CardTitle>
              <CardDescription className="text-green-100">
                Test how the AI will respond to student questions about your content
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Student Question
                </Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question like a student would... e.g., 'How do I solve linear equations?' or 'What is the main concept here?'"
                  className="min-h-[120px] border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Search Mode</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">Hybrid (Best Results)</SelectItem>
                      <SelectItem value="vector">Vector Only (Semantic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    AI Focus: {alpha > 0.7 ? 'Semantic' : alpha < 0.3 ? 'Keyword' : 'Balanced'}
                  </Label>
                  <div className="px-2">
                    <Slider
                      value={[alpha]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(v) => setAlpha(v[0] ?? 0.5)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Keyword Match</span>
                      <span>Semantic Understanding</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Test AI Response
                  </>
                )}
              </Button>
              
              {answer && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI Response Preview
                  </Label>
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 overflow-auto max-h-80 whitespace-pre-wrap font-mono">
                      {answer}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
