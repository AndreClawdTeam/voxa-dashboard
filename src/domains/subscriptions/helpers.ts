import { formatDate } from '@/lib/format-date';
import { STATUS_LABELS } from './constants';
import type { SubscriptionStatus } from './schemas';

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

export function getSubscriptionStatusLabel(status: string): string {
  return (STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} → ${formatDate(end)}`;
}

// Re-export SubscriptionStatus type for consumers that use it via helpers
export type { SubscriptionStatus };
