import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CustomerStatusBadge } from './CustomerStatusBadge';

describe('CustomerStatusBadge', () => {
  it('exibe "Ativo" e classe verde quando isActive=true', () => {
    render(<CustomerStatusBadge isActive={true} />);
    const badge = screen.getByText('Ativo');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
    expect(badge).toHaveClass('text-green-700');
  });

  it('exibe "Inativo" e classe vermelha quando isActive=false', () => {
    render(<CustomerStatusBadge isActive={false} />);
    const badge = screen.getByText('Inativo');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
    expect(badge).toHaveClass('text-red-700');
  });
});
