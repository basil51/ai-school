"use client";
import React, { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

type MermaidDiagramProps = {
  chart: string;
  theme?: 'default' | 'dark' | 'neutral' | 'forest';
};

export default function MermaidDiagram({ chart, theme = 'default' }: MermaidDiagramProps) {
  const id = useId().replace(/[:]/g, '');
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    mermaid.initialize({ startOnLoad: false, theme });
    (async () => {
      try {
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        setSvg(`<pre class="text-red-600 whitespace-pre-wrap">${String(err)}</pre>`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, theme]);

  return <div className="w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}


