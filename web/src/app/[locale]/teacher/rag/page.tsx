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
import { FileText, Upload, Search, AlertCircle } from "lucide-react";
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

  // Check if user has permission to access this page
  useEffect(() => {
    if (status === "loading") return;
    if (!session || ((session as any).role !== "teacher" && (session as any).role !== "admin")) {
      router.push(`/${locale}/dashboard`);
    }
  }, [session, status, router, locale]);

  async function handleUpload() {
    if (!file) return;
    
    setUploadLoading(true);
    setUploadStatus(dict?.rag?.uploading || "Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    
    try {
      const res = await fetch("/api/content/upload", { method: "POST", body: fd });
      const data = await res.json();
      
      if (res.ok) {
        const uploadedText = (dict?.rag?.uploadedDocId || "Uploaded docId={docId}, chars={chars}")
          .replace('{docId}', data.docId)
          .replace('{chars}', data.chars);
        setUploadStatus(uploadedText);
        
        // For demo, read the file content and ingest it
        const content = await file.text();
        const ingestRes = await fetch("/api/rag/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: data.docId, rawText: content }),
        });
        
        if (ingestRes.ok) {
          setUploadStatus(dict?.rag?.documentUploadedIngested || "Document uploaded and ingested successfully!");
          setFile(null);
        } else {
          setUploadStatus(dict?.rag?.uploadedButIngestionFailed || "Uploaded but ingestion failed");
        }
      } else {
        const errorText = (dict?.rag?.uploadFailedError || "Upload failed: {error}")
          .replace('{error}', data.error);
        setUploadStatus(errorText);
      }
    } catch (error) {
      setUploadStatus(dict?.rag?.uploadError || "Upload failed");
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{dict?.rag?.contentManagement || "Content Management"}</h1>
            <p className="text-gray-600 mt-2">{dict?.rag?.contentManagementDescription || "Upload and manage educational materials for the AI tutor"}</p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {dict?.roles?.[(session as any).role] || (session as any).role}
          </Badge>
        </div>
        
        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {dict?.rag?.uploadDocument || "Upload Document"}
              </CardTitle>
              <CardDescription>
                {dict?.rag?.uploadDocumentDescription || "Upload educational materials (.txt files) to be processed by the AI tutor"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file">{dict?.rag?.selectFile || "Select File"}</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {dict?.rag?.currentlySupportsTxt || "Currently supports .txt files only"}
                </p>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!file || uploadLoading}
                className="w-full"
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {dict?.rag?.uploading || "Uploading..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {dict?.rag?.uploadAndProcess || "Upload & Process"}
                  </>
                )}
              </Button>
              
              {uploadStatus && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadStatus}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Query Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {dict?.rag?.testDocumentSearch || "Test Document Search"}
              </CardTitle>
              <CardDescription>
                {dict?.rag?.testDocumentSearchDescription || "Test the RAG system by asking questions about uploaded documents"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="question">{dict?.rag?.question || "Question"}</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={dict?.rag?.questionPlaceholder || "Ask a question about your uploaded documents..."}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{dict?.rag?.mode || "Mode"}</Label>
                  <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={dict?.rag?.selectMode || "Select mode"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">{dict?.rag?.hybridLexicalVector || "Hybrid (lexical + vector)"}</SelectItem>
                      <SelectItem value="vector">{dict?.rag?.vectorOnly || "Vector only"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{dict?.rag?.alphaVectorWeight || "Alpha (vector weight)"}: {alpha.toFixed(2)}</Label>
                  <div className="mt-3">
                    <Slider
                      value={[alpha]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={(v) => setAlpha(v[0] ?? 0.5)}
                    />
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {dict?.rag?.searching || "Searching..."}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    {dict?.rag?.searchDocumentsButton || "Search Documents"}
                  </>
                )}
              </Button>
              
              {answer && (
                <div className="mt-4">
                  <Label>{dict?.rag?.searchResults || "Search Results"}</Label>
                  <div className="mt-2 bg-gray-50 p-4 rounded-md border">
                    <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
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
