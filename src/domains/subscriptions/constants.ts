import type { SubscriptionStatus, Tier, UpgradeTier } from './schemas';

// ─── Tier labels — single source of truth ────────────────────────────────────

export const TIER_LABELS: Record<Tier, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
};

// ─── Status labels — single source of truth ──────────────────────────────────

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

// ─── Plan upgrade labels — single source of truth ────────────────────────────

export const PLAN_LABELS: Record<UpgradeTier, string> = {
  basic: 'Basic',
  pro: 'Pro',
};

// ─── Rate limits per tier — single source of truth ───────────────────────────

export const TIER_RATE_LIMITS: Record<Tier, number> = {
  trial: 20,
  basic: 60,
  pro: 300,
};

// ─── Plan order — single source of truth ─────────────────────────────────────

export const PLAN_ORDER = ['trial', 'basic', 'pro'] as const satisfies Tier[];

// ─── Plan features — single source of truth ──────────────────────────────────

export const PLAN_FEATURES: Record<
  Tier,
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
