"use client";
import { useEffect, useRef, useState } from "react";

export default function TutorPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
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

      await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: up.docId, rawText }),
      });
      
      alert("Document uploaded and ingested successfully!");
    } catch (error) {
      alert("Upload failed");
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
      setAnswer("Failed to get streaming response");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Tutor</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Learning Material</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload textbook or notes (.txt for demo)
            </label>
            <input
              type="file"
              onChange={handleUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {docId && (
              <p className="text-xs text-gray-500">Document ID: {docId}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Ask Your AI Tutor</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Ask a question about your uploaded material
            </label>
            <textarea
              ref={textRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Explain the distributive property with an example"
            />
            <button
              onClick={ask}
              disabled={busy || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Thinking..." : "Ask Tutor"}
            </button>
          </div>
        </div>

        {answer && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Tutor Response</h3>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {answer}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
