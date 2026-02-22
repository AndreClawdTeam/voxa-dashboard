'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TranscriptionTextViewerProps {
  text: string;
}

export function TranscriptionTextViewer({ text }: TranscriptionTextViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? 'Copiado! ✓' : 'Copiar'}
        </Button>
      </div>
      <div
        className="overflow-y-auto rounded-md border bg-muted/30 p-4"
        style={{ maxHeight: '400px' }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
