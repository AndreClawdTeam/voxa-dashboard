import type { AdminCustomerDetail } from '../schemas';

interface Props {
  customer: AdminCustomerDetail;
}

const TIER_LABELS: Record<string, string> = { trial: 'Trial', basic: 'Basic', pro: 'Pro' };
const STATUS_LABELS: Record<string, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

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
          <span>{new Date(sub.trialEndsAt).toLocaleDateString('pt-BR')}</span>
        </div>
      )}
      {sub.currentPeriodStart && sub.currentPeriodEnd && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Período</span>
          <span>
            {new Date(sub.currentPeriodStart).toLocaleDateString('pt-BR')} →{' '}
            {new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')}
          </span>
        </div>
      )}
    </div>
  );
}
