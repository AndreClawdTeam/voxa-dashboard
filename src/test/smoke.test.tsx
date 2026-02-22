import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';
import { isApiError } from '@/lib/zod';

describe('Setup smoke tests', () => {
  it('shadcn/ui Button renders correctly', () => {
    render(<Button>Teste</Button>);
    expect(screen.getByRole('button', { name: 'Teste' })).toBeInTheDocument();
  });

  it('isApiError type guard works correctly', () => {
    expect(isApiError({ error: 'Unauthorized', code: 'UNAUTHORIZED' })).toBe(true);
    expect(isApiError({ message: 'not api error' })).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError('string')).toBe(false);
  });

  it('rejects type assertion — Zod safeParse works', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { z } = require('zod');
    const Schema = z.object({ id: z.string(), name: z.string() });

    const valid = Schema.safeParse({ id: '123', name: 'test' });
    expect(valid.success).toBe(true);

    const invalid = Schema.safeParse({ id: 123, name: 'test' });
    expect(invalid.success).toBe(false);
  });
});
