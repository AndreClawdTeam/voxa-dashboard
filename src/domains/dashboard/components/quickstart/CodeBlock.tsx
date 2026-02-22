'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-md bg-zinc-900 border border-zinc-700">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
        {language && (
          <span className="text-xs text-zinc-400 font-mono select-none">{language}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="ml-auto h-7 px-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          aria-label="Copiar código"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Copiar</span>
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-zinc-100 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
