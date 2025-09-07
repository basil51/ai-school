"use client";
import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type MathRendererProps = {
  expression: string;
  displayMode?: boolean;
  errorColor?: string;
};

export default function MathRenderer({
  expression,
  displayMode = true,
  errorColor = '#dc2626'
}: MathRendererProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(expression, {
        displayMode,
        throwOnError: false,
        errorColor
      });
    } catch (error) {
      return `<span style="color:${errorColor}">${String(error)}</span>`;
    }
  }, [expression, displayMode, errorColor]);

  return (
    <div
      className="katex text-center"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}


