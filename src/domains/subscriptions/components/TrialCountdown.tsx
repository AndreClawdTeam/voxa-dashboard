'use client';

import { useEffect, useState } from 'react';

interface Props {
  trialEndsAt: string;
}

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, total: 0 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours, total: diff };
}

function getUrgencyColor(days: number) {
  if (days < 3) return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
  if (days <= 7)
    return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' };
}

export function TrialCountdown({ trialEndsAt }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(trialEndsAt));

  useEffect(() => {
    const interval = setInterval(
      () => setTimeLeft(getTimeLeft(trialEndsAt)),
      1000 * 60 * 60, // atualiza a cada hora
    );
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  const { days, hours } = timeLeft;
  const colors = getUrgencyColor(days);
  const trialDays = 7;
  const daysUsed = Math.max(0, trialDays - days);
  const progress = Math.min(100, (daysUsed / trialDays) * 100);

  if (timeLeft.total <= 0) {
    return (
      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
        <p className="text-red-700 font-medium">
          Trial expirado. Faça upgrade para continuar usando a Voxa.
        </p>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`font-medium ${colors.text}`}>
          ⏳ {days > 0 ? `${days} dias` : ''}
          {hours > 0 ? ` e ${hours} horas` : ''} restantes no Trial
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colors.bar} h-2 rounded-full transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {daysUsed} de {trialDays} dias usados
      </p>
    </div>
  );
}
