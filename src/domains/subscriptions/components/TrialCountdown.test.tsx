import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TrialCountdown } from './TrialCountdown';

describe('TrialCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve renderizar com cor amarela quando trial tem 5 dias restantes', () => {
    // Set current time to now, trial ends 5 days from now
    const now = new Date('2026-02-21T12:00:00Z');
    vi.setSystemTime(now);

    const trialEndsAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const { container } = render(<TrialCountdown trialEndsAt={trialEndsAt} />);

    // 5 days → yellow urgency color
    expect(screen.getByText(/5 dias/)).toBeInTheDocument();
    expect(screen.getByText(/restantes no Trial/)).toBeInTheDocument();

    // Verify yellow color classes are applied
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-yellow-50');
    expect(wrapper.className).toContain('border-yellow-200');
  });

  it('deve renderizar mensagem de expirado quando data está no passado', () => {
    const now = new Date('2026-02-21T12:00:00Z');
    vi.setSystemTime(now);

    // Trial ended 2 days ago
    const trialEndsAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

    render(<TrialCountdown trialEndsAt={trialEndsAt} />);

    expect(
      screen.getByText(/Trial expirado\. Faça upgrade para continuar usando a Voxa\./),
    ).toBeInTheDocument();
  });

  it('deve renderizar com cor vermelha quando trial tem menos de 3 dias', () => {
    const now = new Date('2026-02-21T12:00:00Z');
    vi.setSystemTime(now);

    // Trial ends in 2 days
    const trialEndsAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const { container } = render(<TrialCountdown trialEndsAt={trialEndsAt} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('bg-red-50');
    expect(wrapper.className).toContain('border-red-200');
    expect(screen.getByText(/2 dias/)).toBeInTheDocument();
  });

  it('deve mostrar quantos dias foram usados no trial', () => {
    const now = new Date('2026-02-21T12:00:00Z');
    vi.setSystemTime(now);

    // Trial started 4 days ago, ends in 3 days (7 days total)
    const trialEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    render(<TrialCountdown trialEndsAt={trialEndsAt} />);

    expect(screen.getByText(/4 de 7 dias usados/)).toBeInTheDocument();
  });
});
