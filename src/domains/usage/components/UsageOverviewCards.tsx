import { Clock, Mic, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TIER_LABELS, TIER_RATE_LIMITS } from '@/domains/subscriptions/constants';
import { formatAudioDuration } from '@/domains/subscriptions/helpers';
import type { Subscription } from '@/domains/subscriptions/schemas';
import { formatDate } from '@/lib/format-date';
import type { Usage } from '../schemas';

interface Props {
  usage: Usage;
  subscription: Subscription;
}

export function UsageOverviewCards({ usage, subscription }: Props) {
  const rateLimit = TIER_RATE_LIMITS[subscription.tier] ?? 20;
  const tierLabel = TIER_LABELS[subscription.tier] ?? subscription.tier;

  const cards = [
    {
      title: 'Transcrições este mês',
      value: usage.transcriptionsCount.toString(),
      subtitle: `Período: ${formatDate(usage.period.start)}`,
      icon: Mic,
    },
    {
      title: 'Áudio processado',
      value: formatAudioDuration(usage.totalAudioDurationSeconds),
      subtitle: `${Math.round(usage.totalProcessingTimeMs / 1000)}s tempo total`,
      icon: Clock,
    },
    {
      title: 'Rate limit',
      value: `${rateLimit} req/min`,
      subtitle: `Plano ${tierLabel}`,
      icon: Zap,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
