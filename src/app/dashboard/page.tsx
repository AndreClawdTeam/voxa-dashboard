import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/domains/auth/service';
import { SubscriptionCard } from '@/domains/subscriptions/components/SubscriptionCard';
import { TrialCountdownBanner } from '@/domains/subscriptions/components/TrialCountdownBanner';
import { getTrialDaysRemaining, isTrialExpiringSoon } from '@/domains/subscriptions/helpers';
import { getCurrentSubscription } from '@/domains/subscriptions/service';
import { UsageOverviewCards } from '@/domains/usage/components/UsageOverviewCards';
import { getMonthlyUsage } from '@/domains/usage/service';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Overview — Voxa Dashboard' };

export default async function DashboardPage() {
  // Busca paralela de dados no servidor
  const [usage, subscription, user] = await Promise.all([
    getMonthlyUsage(),
    getCurrentSubscription(),
    getCurrentUser(),
  ]);

  const showTrialBanner =
    subscription.status === 'trial' && isTrialExpiringSoon(subscription.trialEndsAt);
  const trialDaysRemaining = getTrialDaysRemaining(subscription.trialEndsAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">Aqui está um resumo da sua conta Voxa</p>
      </div>

      {showTrialBanner && <TrialCountdownBanner daysRemaining={trialDaysRemaining} />}

      <Suspense fallback={<UsageSkeleton />}>
        <UsageOverviewCards usage={usage} subscription={subscription} />
      </Suspense>

      <SubscriptionCard subscription={subscription} />
    </div>
  );
}

function UsageSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>
  );
}
