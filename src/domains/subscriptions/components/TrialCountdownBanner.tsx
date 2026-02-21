'use client';

import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  daysRemaining: number;
}

export function TrialCountdownBanner({ daysRemaining }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const urgency = daysRemaining <= 1 ? 'destructive' : 'default';

  return (
    <Alert variant={urgency} className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <AlertDescription>
          {daysRemaining === 0
            ? 'Seu trial expira hoje!'
            : `Seu trial expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}.`}{' '}
          <Link href="/dashboard/subscription" className="font-semibold underline">
            Fazer upgrade agora
          </Link>
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X size={14} />
      </Button>
    </Alert>
  );
}
