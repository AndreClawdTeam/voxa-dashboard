import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionButton } from './ActionButton';

const mockAction = vi.fn().mockResolvedValue({ success: true });

describe('ActionButton', () => {
  it('renders with default text when no children', () => {
    render(<ActionButton action={mockAction} />);
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(<ActionButton action={mockAction}>Revogar</ActionButton>);
    expect(screen.getByRole('button', { name: 'Revogar' })).toBeInTheDocument();
  });

  it('renders hidden inputs from data prop', () => {
    render(<ActionButton action={mockAction} data={{ id: 'abc-123', type: 'test' }} />);
    const form = screen.getByRole('button').closest('form');
    expect(form?.querySelector('input[name="id"]')).toHaveValue('abc-123');
    expect(form?.querySelector('input[name="type"]')).toHaveValue('test');
  });
});
