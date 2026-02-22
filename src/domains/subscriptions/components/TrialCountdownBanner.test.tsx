import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TrialCountdownBanner } from './TrialCountdownBanner';

describe('TrialCountdownBanner', () => {
  it('deve renderizar com 1 dia restante no singular', () => {
    render(<TrialCountdownBanner daysRemaining={1} />);

    expect(screen.getByText(/Seu trial expira em 1 dia\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fazer upgrade agora/ })).toBeInTheDocument();
  });

  it('deve renderizar com 3 dias restantes no plural', () => {
    render(<TrialCountdownBanner daysRemaining={3} />);

    expect(screen.getByText(/Seu trial expira em 3 dias\./)).toBeInTheDocument();
  });

  it('deve renderizar com urgência quando 0 dias restantes', () => {
    render(<TrialCountdownBanner daysRemaining={0} />);

    expect(screen.getByText(/Seu trial expira hoje!/)).toBeInTheDocument();
  });

  it('deve ocultar o banner quando botão de dismiss é clicado', async () => {
    const user = userEvent.setup();
    render(<TrialCountdownBanner daysRemaining={3} />);

    const dismissButton = screen.getByRole('button');
    await user.click(dismissButton);

    expect(screen.queryByText(/Seu trial expira/)).not.toBeInTheDocument();
  });

  it('deve exibir link para /dashboard/subscription', () => {
    render(<TrialCountdownBanner daysRemaining={2} />);

    const link = screen.getByRole('link', { name: /Fazer upgrade agora/ });
    expect(link).toHaveAttribute('href', '/dashboard/subscription');
  });

  it('deve mostrar botão de fechar', () => {
    render(<TrialCountdownBanner daysRemaining={2} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
