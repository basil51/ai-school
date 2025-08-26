"use client";
import { useState } from "react";

export default function RagPage() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handleUpload() {
    if (!file) return;
    
    setUploadStatus("Uploading...");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    
    try {
      const res = await fetch("/api/content/upload", { method: "POST", body: fd });
      const data = await res.json();
      
      if (res.ok) {
        setUploadStatus(`Uploaded docId=${data.docId}, chars=${data.chars}`);
        
        // For demo, read the file content and ingest it
        const content = await file.text();
        const ingestRes = await fetch("/api/rag/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: data.docId, rawText: content }),
        });
        
        if (ingestRes.ok) {
          setUploadStatus("Document uploaded and ingested successfully!");
        } else {
          setUploadStatus("Uploaded but ingestion failed");
        }
      } else {
        setUploadStatus(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      setUploadStatus("Upload failed");
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
        body: JSON.stringify({ question, k: 5 }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setAnswer(JSON.stringify(data.snippets, null, 2));
      } else {
        setAnswer(`Error: ${data.error}`);
      }
    } catch (error) {
      setAnswer("Failed to process query");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">RAG Demo</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
          <div className="space-y-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={!file}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Upload & Ingest
            </button>
            {uploadStatus && (
              <p className="text-sm text-gray-600">{uploadStatus}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
          <div className="space-y-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your uploaded document..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Searching..." : "Ask"}
            </button>
            
            {answer && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
                  {answer}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
