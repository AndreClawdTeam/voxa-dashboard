import { PLAN_FEATURES } from '../helpers';
import type { Subscription } from '../schemas';
import { UpgradePlanButton } from './UpgradePlanButton';

interface Props {
  subscription: Subscription;
}

const PLAN_ORDER = ['trial', 'basic', 'pro'] as const;

export function PlanComparisonCards({ subscription }: Props) {
  const currentTierIndex = PLAN_ORDER.indexOf(subscription.tier as (typeof PLAN_ORDER)[number]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PLAN_ORDER.map((tier) => {
        const plan = PLAN_FEATURES[tier];
        if (!plan) return null;
        const isCurrent = tier === subscription.tier;
        const tierIndex = PLAN_ORDER.indexOf(tier);
        const isUpgrade = tierIndex > currentTierIndex;

        return (
          <div
            key={tier}
            className={`border rounded-lg p-5 space-y-4 ${
              isCurrent ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{plan.label}</h3>
              {isCurrent && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                  Atual
                </span>
              )}
            </div>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.rateLimit}</p>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex items-center gap-2">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            {tier !== 'trial' && (
              <UpgradePlanButton
                tier={tier as 'basic' | 'pro'}
                disabled={!isUpgrade}
                label={
                  isCurrent ? 'Plano atual' : isUpgrade ? 'Fazer upgrade' : 'Downgrade indisponível'
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
