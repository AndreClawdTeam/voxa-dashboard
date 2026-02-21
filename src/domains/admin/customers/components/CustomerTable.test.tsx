import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AdminCustomer } from '../schemas';
import { CustomerTable } from './CustomerTable';

const mockCustomers: AdminCustomer[] = [
  {
    id: 'user-1',
    name: 'Ana Lima',
    email: 'ana@example.com',
    role: 'customer',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    name: 'Bruno Costa',
    email: 'bruno@example.com',
    role: 'customer',
    isActive: false,
    createdAt: '2024-03-20T08:30:00Z',
  },
];

describe('CustomerTable', () => {
  it('renderiza lista de clientes com nome, email e status', () => {
    render(<CustomerTable customers={mockCustomers} />);

    expect(screen.getByText('Ana Lima')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();

    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
    expect(screen.getByText('bruno@example.com')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
  });

  it('exibe "Nenhum cliente encontrado" quando lista vazia', () => {
    render(<CustomerTable customers={[]} />);
    expect(screen.getByText('Nenhum cliente encontrado.')).toBeInTheDocument();
  });

  it('links "Ver detalhe →" apontam para /admin/customers/:id', () => {
    render(<CustomerTable customers={mockCustomers} />);

    const links = screen.getAllByRole('link', { name: /Ver detalhe/i });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/admin/customers/user-1');
    expect(links[1]).toHaveAttribute('href', '/admin/customers/user-2');
  });

  it('exibe cabeçalhos de coluna corretos', () => {
    render(<CustomerTable customers={mockCustomers} />);

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('E-mail')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Membro desde')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });
});
