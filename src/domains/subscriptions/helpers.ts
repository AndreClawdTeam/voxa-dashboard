export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpiringSoon(trialEndsAt: string | null, thresholdDays = 3): boolean {
  const days = getTrialDaysRemaining(trialEndsAt);
  return days > 0 && days <= thresholdDays;
}

export function formatAudioDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
}

export const TIER_LABELS: Record<string, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
};

export const TIER_RATE_LIMITS: Record<string, number> = {
  trial: 20,
  basic: 60,
  pro: 300,
};

export function getSubscriptionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    trial: 'Trial',
    active: 'Ativa',
    suspended: 'Suspensa',
    cancelled: 'Cancelada',
  };
  return labels[status] ?? status;
}

export function formatPeriod(start: string, end: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR');
  return `${fmt(start)} → ${fmt(end)}`;
}

export const PLAN_FEATURES: Record<
  string,
  { label: string; rateLimit: string; features: string[]; price: string }
> = {
  trial: {
    label: 'Trial',
    rateLimit: '20 req/min',
    price: 'Grátis',
    features: ['20 requisições/minuto', '7 dias de acesso', 'Todas as funcionalidades'],
  },
  basic: {
    label: 'Basic',
    rateLimit: '60 req/min',
    price: 'R$ 49/mês',
    features: ['60 requisições/minuto', 'Suporte por e-mail', 'Histórico ilimitado'],
  },
  pro: {
    label: 'Pro',
    rateLimit: '300 req/min',
    price: 'R$ 149/mês',
    features: ['300 requisições/minuto', 'Suporte prioritário', 'Histórico ilimitado', 'SLA 99.9%'],
  },
};
