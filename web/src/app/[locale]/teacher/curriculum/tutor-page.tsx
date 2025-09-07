"use client";
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Upload, 
  MessageCircle, 
  Brain, 
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useTranslations } from "@/lib/useTranslations";
//import { useParams } from "next/navigation";

export default function TutorPage() {
  const { dict } = useTranslations();
  //const params = useParams();
  //const locale = params.locale as string;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  //const [uploadLoading, setUploadLoading] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    //setUploadLoading(true);
    setUploadStatus(dict?.tutor?.uploading || "Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    
    try {
      const up = await fetch("/api/content/upload", { method: "POST", body: fd }).then((r) => r.json());
      setDocId(up.docId);

      // Read raw text client-side (for demo, allow .txt here)
      const isText = file.type.includes("text");
      let rawText = "";
      
      if (isText) {
        rawText = await file.text();
      } else {
        alert("For PDFs, add a small endpoint to return parsed text, or upload a .txt for this demo.");
        return;
      }

      // Enqueue background job
      const enq = await fetch("/api/rag/ingest/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: up.docId, rawText }),
      }).then((r) => r.json());

      const jobId = enq.jobId as string;
      setUploadStatus(dict?.tutor?.ingestionStarted || "Ingestion started...");

      // Poll for job status
      let done = false;
      while (!done) {
        const st = await fetch(`/api/rag/ingest/status?jobId=${jobId}`).then((r) => r.json());
        const pct = typeof st.progress === "number" ? st.progress : 0;
        const progressText = (dict?.tutor?.ingestionProgress || "Ingestion: {progress}% (state={state})")
          .replace('{progress}', pct.toString())
          .replace('{state}', st.state);
        setUploadStatus(progressText);
        
        if (st.state === "completed" || st.state === "failed" || st.status === "not_found") {
          done = true;
        }
        
        if (!done) {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }

      setUploadStatus(dict?.tutor?.ingestionCompleted || "Ingestion completed successfully!");
    } catch (error) {
      setUploadStatus(dict?.tutor?.uploadFailed || "Upload failed");
      console.error("Upload failed:", error);
    } finally {
      //setUploadLoading(false);
    }
  }

  async function ask() {
    if (!question.trim()) return;
    
    setBusy(true);
    setAnswer("");
    
    try {
      const res = await fetch("/api/chat/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        setAnswer((prev) => prev + chunk);
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setAnswer(dict?.tutor?.failedToGetResponse || "Failed to get streaming response");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dict?.tutor?.title || "AI Tutor"}</h1>
            <p className="text-gray-600 mt-2">{dict?.tutor?.subtitle || "Your personalized AI learning assistant"}</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            {dict?.tutor?.aiPowered || "AI Powered"}
          </Badge>
        </div>
        
        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {dict?.tutor?.uploadLearningMaterial || "Upload Learning Material"}
              </CardTitle>
              <CardDescription>
                {dict?.tutor?.uploadLearningMaterialDescription || "Upload textbooks, notes, or educational content for the AI tutor to reference"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">{dict?.tutor?.selectFile || "Select File"}</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".txt"
                  onChange={handleUpload}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {dict?.tutor?.currentlySupports || "Currently supports .txt files. PDF support coming soon."}
                </p>
              </div>
              
              {docId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {dict?.tutor?.documentId || "Document ID"}: {docId}
                </div>
              )}
              
              {uploadStatus && (
                <Alert>
                  {uploadStatus.includes("completed") ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : uploadStatus.includes("failed") ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <AlertDescription>{uploadStatus}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {dict?.tutor?.askYourAITutor || "Ask Your AI Tutor"}
              </CardTitle>
              <CardDescription>
                {dict?.tutor?.askYourAITutorDescription || "Ask questions about your uploaded material and get instant, contextual answers"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question">{dict?.tutor?.yourQuestion || "Your Question"}</Label>
                <Textarea
                  id="question"
                  ref={textRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={dict?.tutor?.questionPlaceholder || "e.g., Explain the distributive property with an example"}
                  className="mt-1 min-h-[120px]"
                />
              </div>
              
              <Button
                onClick={ask}
                disabled={busy || !question.trim()}
                className="w-full"
                size="lg"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {dict?.tutor?.thinking || "Thinking..."}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    {dict?.tutor?.askTutor || "Ask Tutor"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Response Section */}
          {answer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {dict?.tutor?.tutorResponse || "Tutor Response"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-md border">
                    {answer}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
