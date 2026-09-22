'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeSnippetBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeSnippetBlock({
  code,
  language = 'bash',
  title,
  className = '',
}: CodeSnippetBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-[#2A4F44] bg-[#142721] text-[#FAF6EE] overflow-hidden shadow-lg font-mono text-left ${className}`}
      dir="ltr"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0E1A16] border-b border-[#2A4F44] text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#B85C43]" />
          <span className="font-bold text-[#E8DCC6] text-[11px]">
            {title || language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          aria-label="نسخ الكود إلى الحافظة"
          title="نسخ الكود"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#FAF6EE] text-[11px] font-sans font-bold transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#E8DCC6]" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <pre className="p-4 text-xs overflow-x-auto leading-relaxed text-[#FAF6EE] selection:bg-[#B85C43]/40">
        <code>{code}</code>
      </pre>
    </div>
  );
}
