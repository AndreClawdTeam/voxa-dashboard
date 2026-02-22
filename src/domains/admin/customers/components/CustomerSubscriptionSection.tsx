import { formatDate } from '@/lib/format-date';
import { STATUS_LABELS, TIER_LABELS } from '../constants';
import type { AdminCustomerDetail } from '../schemas';

interface Props {
  customer: AdminCustomerDetail;
}

export function CustomerSubscriptionSection({ customer }: Props) {
  const sub = customer.subscription;

  if (!sub) {
    return <p className="text-muted-foreground text-sm">Sem assinatura ativa.</p>;
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Plano</span>
        <span className="font-medium">{TIER_LABELS[sub.tier] ?? sub.tier}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Status</span>
        <span>{STATUS_LABELS[sub.status] ?? sub.status}</span>
      </div>
      {sub.trialEndsAt && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Trial até</span>
          <span>{formatDate(sub.trialEndsAt)}</span>
        </div>
      )}
      {sub.currentPeriodStart && sub.currentPeriodEnd && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Período</span>
          <span>
            {formatDate(sub.currentPeriodStart)} → {formatDate(sub.currentPeriodEnd)}
          </span>
        </div>
      )}
    </div>
  );
}
