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

      {/* Dados já resolvidos — Suspense não tem efeito aqui, usar diretamente */}
      <UsageOverviewCards usage={usage} subscription={subscription} />

      <SubscriptionCard subscription={subscription} />
    </div>
  );
}
