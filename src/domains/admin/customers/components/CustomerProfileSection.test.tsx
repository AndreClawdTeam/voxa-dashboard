import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AdminCustomerDetail } from '../schemas';
import { CustomerProfileSection } from './CustomerProfileSection';

const baseCustomer: AdminCustomerDetail = {
  id: 'abc-123',
  email: 'maria@example.com',
  name: 'Maria Silva',
  role: 'customer',
  isActive: true,
  createdAt: '2024-06-15T10:00:00Z',
};

describe('CustomerProfileSection', () => {
  it('renderiza nome do cliente', () => {
    render(<CustomerProfileSection customer={baseCustomer} />);
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('renderiza e-mail do cliente', () => {
    render(<CustomerProfileSection customer={baseCustomer} />);
    expect(screen.getByText('maria@example.com')).toBeInTheDocument();
  });

  it('renderiza role "customer" como "Cliente" com badge cinza', () => {
    render(<CustomerProfileSection customer={baseCustomer} />);
    const badge = screen.getByText('Cliente');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-700');
  });

  it('renderiza role "admin" com badge azul', () => {
    render(<CustomerProfileSection customer={{ ...baseCustomer, role: 'admin' }} />);
    const badge = screen.getByText('Admin');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-700');
  });

  it('renderiza badge verde para conta ativa (isActive=true)', () => {
    render(<CustomerProfileSection customer={baseCustomer} />);
    const badge = screen.getByText('Ativo');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
  });

  it('renderiza badge vermelho para conta inativa (isActive=false)', () => {
    render(<CustomerProfileSection customer={{ ...baseCustomer, isActive: false }} />);
    const badge = screen.getByText('Inativo');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
  });

  it('renderiza data de criação formatada', () => {
    render(<CustomerProfileSection customer={baseCustomer} />);
    // The date 2024-06-15 should appear in some formatted form
    const memberSince = screen.getByText(/2024/);
    expect(memberSince).toBeInTheDocument();
  });
});
