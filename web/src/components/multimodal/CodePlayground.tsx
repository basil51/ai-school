"use client";
import React, { useEffect, useRef, useState } from 'react';

type CodePlaygroundProps = {
  initialCode?: string;
  height?: number;
};

export default function CodePlayground({ initialCode = "console.log('Hello, world!')", height = 280 }: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [output, setOutput] = useState<string>('');

  const run = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>
      const log = [];
      const originalLog = console.log;
      console.log = (...args) => { log.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); originalLog(...args); };
      try { ${code} } catch (e) { console.log('Error:', e.message); }
      parent.postMessage({ type: 'playground:output', log }, '*');
    <\/script></body></html>`;
    if (iframeRef.current) {
      iframeRef.current.srcdoc = html;
    }
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'playground:output') {
        setOutput((e.data.log || []).join('\n'));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="grid gap-2">
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        className="w-full font-mono text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={Math.max(6, Math.floor(height / 40))}
      />
      <div className="flex gap-2">
        <button onClick={run} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Run</button>
        <button onClick={() => setOutput('')} className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Clear Output</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <iframe ref={iframeRef} className="w-full border border-gray-200 rounded-lg bg-white" style={{ height }} />
        <pre className="w-full border border-gray-200 rounded-lg bg-gray-50 p-3 text-xs overflow-auto whitespace-pre-wrap">{output}</pre>
      </div>
    </div>
  );
}


