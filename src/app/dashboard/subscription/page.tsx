import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanComparisonCards } from '@/domains/subscriptions/components/PlanComparisonCards';
import { TrialCountdown } from '@/domains/subscriptions/components/TrialCountdown';
import { TIER_LABELS } from '@/domains/subscriptions/constants';
import { formatPeriod, getSubscriptionStatusLabel } from '@/domains/subscriptions/helpers';
import { getCurrentSubscriptionSafe } from '@/domains/subscriptions/service';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Assinatura — Voxa Dashboard',
};

export default async function SubscriptionPage() {
  const subscription = await getCurrentSubscriptionSafe();

  // Sem subscription (ex: admin acessou diretamente) → 404
  if (subscription == null) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano Voxa</p>
      </div>

      {/* Alerta para status suspenso/cancelado */}
      {(subscription.status === 'suspended' || subscription.status === 'cancelled') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">
            Assinatura {getSubscriptionStatusLabel(subscription.status).toLowerCase()}
          </p>
          <p className="text-sm mt-1">
            Entre em contato com suporte@voxa.ai para regularizar sua conta.
          </p>
        </div>
      )}

      {/* Trial countdown */}
      {subscription.status === 'trial' && subscription.trialEndsAt && (
        <TrialCountdown trialEndsAt={subscription.trialEndsAt} />
      )}

      {/* Card do plano atual */}
      <Card>
        <CardHeader>
          <CardTitle>Plano atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tier</span>
            <span className="font-medium">
              {TIER_LABELS[subscription.tier] ?? subscription.tier}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span>{getSubscriptionStatusLabel(subscription.status)}</span>
          </div>
          {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período</span>
              <span>
                {formatPeriod(subscription.currentPeriodStart, subscription.currentPeriodEnd)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade de plano */}
      {subscription.status !== 'cancelled' && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Planos disponíveis</h2>
          <PlanComparisonCards subscription={subscription} />
        </div>
      )}
    </div>
  );
}
