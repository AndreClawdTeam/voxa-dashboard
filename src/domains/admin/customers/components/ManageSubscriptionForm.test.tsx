import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { AdminCustomerDetail } from '../schemas';
import { ManageSubscriptionForm } from './ManageSubscriptionForm';

// Mock sonner to avoid errors
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock Server Action
vi.mock('../actions', () => ({
  updateSubscriptionAction: vi.fn(async () => ({ success: true })),
}));

// Radix UI Select uses pointer capture and scroll APIs not supported in jsdom
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const customer: AdminCustomerDetail = {
  id: 'cust-001',
  email: 'joao@example.com',
  name: 'João Costa',
  role: 'customer',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  subscription: {
    id: 'sub-001',
    tier: 'basic',
    status: 'active',
    trialEndsAt: null,
    currentPeriodStart: '2024-01-01T00:00:00Z',
    currentPeriodEnd: '2024-02-01T00:00:00Z',
  },
};

describe('ManageSubscriptionForm', () => {
  it('renderiza selects de tier e status', () => {
    render(<ManageSubscriptionForm customer={customer} customerId="cust-001" />);
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('botão "Salvar alterações" desabilitado quando nada mudou', () => {
    render(<ManageSubscriptionForm customer={customer} customerId="cust-001" />);
    const button = screen.getByRole('button', { name: /Salvar alterações/i });
    expect(button).toBeDisabled();
  });

  it('ao clicar em tier diferente, o botão fica habilitado', async () => {
    const user = userEvent.setup();
    render(<ManageSubscriptionForm customer={customer} customerId="cust-001" />);

    // Click on Pro option via trigger
    const tierTrigger = screen.getAllByRole('combobox').find(Boolean);
    expect(tierTrigger).toBeDefined();
    await user.click(tierTrigger as HTMLElement);
    const proOption = screen.getByRole('option', { name: 'Pro' });
    await user.click(proOption);

    const button = screen.getByRole('button', { name: /Salvar alterações/i });
    expect(button).not.toBeDisabled();
  });

  it('ao clicar em Salvar, exibe AlertDialog de confirmação', async () => {
    const user = userEvent.setup();
    render(<ManageSubscriptionForm customer={customer} customerId="cust-001" />);

    // Change tier to pro first to enable button
    const tierTrigger = screen.getAllByRole('combobox').find(Boolean);
    expect(tierTrigger).toBeDefined();
    await user.click(tierTrigger as HTMLElement);
    const proOption = screen.getByRole('option', { name: 'Pro' });
    await user.click(proOption);

    const button = screen.getByRole('button', { name: /Salvar alterações/i });
    await user.click(button);

    expect(screen.getByText('Confirmar alteração de assinatura')).toBeInTheDocument();
    expect(screen.getByText(/João Costa/)).toBeInTheDocument();
  });

  it('renderiza sem subscription atual sem quebrar', () => {
    const customerNoSub: AdminCustomerDetail = { ...customer, subscription: null };
    render(<ManageSubscriptionForm customer={customerNoSub} customerId="cust-001" />);
    expect(screen.getByText('Tier')).toBeInTheDocument();
  });
});
