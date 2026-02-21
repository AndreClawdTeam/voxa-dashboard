import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatAudioDuration,
  formatPeriod,
  getSubscriptionStatusLabel,
  getTrialDaysRemaining,
  isTrialExpiringSoon,
} from './helpers';

afterEach(() => {
  vi.useRealTimers();
});

describe('getTrialDaysRemaining', () => {
  it('deve retornar 0 quando trialEndsAt é null', () => {
    expect(getTrialDaysRemaining(null)).toBe(0);
  });

  it('deve retornar 0 quando trial já expirou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T12:00:00Z'));
    expect(getTrialDaysRemaining('2026-02-20T00:00:00Z')).toBe(0);
  });

  it('deve retornar 1 quando trial expira hoje (menos de 24h)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T12:00:00Z'));
    expect(getTrialDaysRemaining('2026-02-21T23:59:00Z')).toBe(1);
  });

  it('deve retornar 3 quando trial expira em exatamente 3 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(getTrialDaysRemaining('2026-02-24T00:00:00Z')).toBe(3);
  });

  it('deve retornar 7 quando trial expira em 7 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(getTrialDaysRemaining('2026-02-28T00:00:00Z')).toBe(7);
  });
});

describe('isTrialExpiringSoon', () => {
  it('deve retornar false quando trialEndsAt é null', () => {
    expect(isTrialExpiringSoon(null)).toBe(false);
  });

  it('deve retornar false quando trial já expirou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T12:00:00Z'));
    expect(isTrialExpiringSoon('2026-02-20T00:00:00Z')).toBe(false);
  });

  it('deve retornar true quando trial expira em 1 dia (dentro do threshold padrão)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(isTrialExpiringSoon('2026-02-22T00:00:00Z')).toBe(true);
  });

  it('deve retornar true quando trial expira em 3 dias (exatamente no threshold padrão)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(isTrialExpiringSoon('2026-02-24T00:00:00Z')).toBe(true);
  });

  it('deve retornar false quando trial expira em 4 dias (acima do threshold padrão)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(isTrialExpiringSoon('2026-02-25T00:00:00Z')).toBe(false);
  });

  it('deve respeitar threshold customizado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-21T00:00:00Z'));
    expect(isTrialExpiringSoon('2026-02-28T00:00:00Z', 7)).toBe(true);
    expect(isTrialExpiringSoon('2026-03-01T00:00:00Z', 7)).toBe(false);
  });
});

describe('formatAudioDuration', () => {
  it('deve formatar segundos quando < 60', () => {
    expect(formatAudioDuration(0)).toBe('0s');
    expect(formatAudioDuration(30)).toBe('30s');
    expect(formatAudioDuration(59)).toBe('59s');
  });

  it('deve formatar em minutos quando >= 60 e < 3600', () => {
    expect(formatAudioDuration(60)).toBe('1min');
    expect(formatAudioDuration(90)).toBe('1min');
    expect(formatAudioDuration(120)).toBe('2min');
    expect(formatAudioDuration(3599)).toBe('59min');
  });

  it('deve formatar em horas quando >= 3600 e minutos restantes = 0', () => {
    expect(formatAudioDuration(3600)).toBe('1h');
    expect(formatAudioDuration(7200)).toBe('2h');
  });

  it('deve formatar em horas e minutos quando há remainder', () => {
    expect(formatAudioDuration(3660)).toBe('1h 1min');
    expect(formatAudioDuration(5400)).toBe('1h 30min');
    expect(formatAudioDuration(7320)).toBe('2h 2min');
  });
});

describe('getSubscriptionStatusLabel', () => {
  it("deve retornar 'Ativa' para status 'active'", () => {
    expect(getSubscriptionStatusLabel('active')).toBe('Ativa');
  });

  it("deve retornar 'Trial' para status 'trial'", () => {
    expect(getSubscriptionStatusLabel('trial')).toBe('Trial');
  });

  it("deve retornar 'Suspensa' para status 'suspended'", () => {
    expect(getSubscriptionStatusLabel('suspended')).toBe('Suspensa');
  });

  it("deve retornar 'Cancelada' para status 'cancelled'", () => {
    expect(getSubscriptionStatusLabel('cancelled')).toBe('Cancelada');
  });

  it('deve retornar o status original para valores desconhecidos', () => {
    expect(getSubscriptionStatusLabel('unknown')).toBe('unknown');
  });
});

describe('formatPeriod', () => {
  it("deve formatar '2026-01-01' → '2026-01-31' como '01/01/2026 → 31/01/2026'", () => {
    // Use fixed timezone to avoid locale flakiness
    const result = formatPeriod('2026-01-01', '2026-01-31');
    expect(result).toMatch(/01\/01\/2026 → 31\/01\/2026/);
  });
});

describe('getTrialDaysRemaining — data no passado retorna 0', () => {
  it('deve retornar 0 quando trial já expirou', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01T00:00:00Z'));
    expect(getTrialDaysRemaining('2026-02-01T00:00:00Z')).toBe(0);
    vi.useRealTimers();
  });
});
