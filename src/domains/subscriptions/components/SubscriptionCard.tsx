import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TIER_LABELS } from '../constants';
import { getTrialDaysRemaining } from '../helpers';
import type { Subscription } from '../schemas';

export function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const daysRemaining = getTrialDaysRemaining(subscription.trialEndsAt);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assinatura</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {TIER_LABELS[subscription.tier] ?? subscription.tier}
            </span>
            <StatusBadge status={subscription.status} />
          </div>
          {subscription.status === 'trial' && daysRemaining > 0 && (
            <p className="text-sm text-muted-foreground">
              {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no trial
            </p>
          )}
        </div>
        {(subscription.status === 'trial' || subscription.tier !== 'pro') && (
          <Button asChild size="sm">
            <Link href="/dashboard/subscription">Fazer upgrade</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
