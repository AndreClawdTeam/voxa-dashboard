import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../schemas';
import { ProfileForm } from './ProfileForm';

// Mock sonner toast to avoid side effects
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the server action
vi.mock('../actions', () => ({
  updateProfileAction: vi.fn(),
}));

const mockProfile: UserProfile = {
  id: 'user-1',
  email: 'andre@example.com',
  name: 'André Treib',
  role: 'customer',
  isActive: true,
  createdAt: '2025-01-15T00:00:00.000Z',
};

describe('ProfileForm', () => {
  it('renderiza campos pré-preenchidos com dados do profile', () => {
    render(<ProfileForm profile={mockProfile} />);

    const nameInput = screen.getByLabelText(/nome/i);
    const emailInput = screen.getByLabelText(/e-mail/i);

    expect(nameInput).toHaveValue('André Treib');
    expect(emailInput).toHaveValue('andre@example.com');
  });

  it('exibe botão Salvar alterações', () => {
    render(<ProfileForm profile={mockProfile} />);
    expect(screen.getByRole('button', { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it('botão de submit está habilitado no estado inicial', () => {
    render(<ProfileForm profile={mockProfile} />);
    const button = screen.getByRole('button', { name: /salvar alterações/i });
    expect(button).not.toBeDisabled();
  });

  it('não exibe erro de apiError no estado inicial', () => {
    render(<ProfileForm profile={mockProfile} />);
    // No error message should appear by default
    expect(screen.queryByText(/erro ao atualizar/i)).not.toBeInTheDocument();
  });

  it('campos de nome e email estão presentes e acessíveis', () => {
    render(<ProfileForm profile={mockProfile} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
  });
});
