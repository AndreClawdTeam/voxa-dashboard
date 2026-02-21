import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RawTokenRevealStep } from './RawTokenRevealStep';

const TOKEN = 'vxa_abc123def456789';

// Configura o clipboard mock antes de cada teste
beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

describe('RawTokenRevealStep', () => {
  it('deve exibir o rawToken', () => {
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);
    expect(screen.getByDisplayValue(TOKEN)).toBeInTheDocument();
  });

  it('deve exibir botão de copiar', () => {
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });

  it('deve exibir checkbox de confirmação', () => {
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('o botão Fechar deve estar desabilitado sem marcar o checkbox', () => {
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /fechar/i })).toBeDisabled();
  });

  it('o botão Fechar deve ficar habilitado ao marcar o checkbox', async () => {
    const user = userEvent.setup();
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(screen.getByRole('button', { name: /fechar/i })).not.toBeDisabled();
  });

  it('deve chamar onClose ao clicar Fechar com checkbox marcado', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={onClose} />);

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /fechar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não deve chamar onClose sem marcar o checkbox', () => {
    const onClose = vi.fn();
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /fechar/i });
    expect(closeBtn).toBeDisabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deve copiar token para área de transferência ao clicar Copiar', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);

    // Use fireEvent para evitar que userEvent.setup() intercepte o clipboard
    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));
    await Promise.resolve(); // flush async writeText

    expect(writeText).toHaveBeenCalledWith(TOKEN);
  });

  it('deve exibir aviso sobre exibição única do token', () => {
    render(<RawTokenRevealStep rawToken={TOKEN} onClose={vi.fn()} />);
    expect(screen.getByText(/única/i)).toBeInTheDocument();
  });
});
