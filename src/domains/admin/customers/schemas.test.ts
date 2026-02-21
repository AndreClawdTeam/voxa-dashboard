import { describe, expect, it } from 'vitest';
import { AdminCustomerSchema, CustomerListParamsSchema } from './schemas';

const validCustomer = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  name: 'João Silva',
  role: 'customer' as const,
  isActive: true,
  createdAt: '2024-01-15T10:00:00Z',
};

describe('CustomerListParamsSchema', () => {
  it('aceita page=1 e limit=20 válidos', () => {
    const result = CustomerListParamsSchema.safeParse({ page: 1, limit: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('coerce string "2" para number 2', () => {
    const result = CustomerListParamsSchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('usa default page=1 quando page não é fornecido', () => {
    const result = CustomerListParamsSchema.safeParse({ limit: 20 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it('usa default limit=20 quando limit não é fornecido', () => {
    const result = CustomerListParamsSchema.safeParse({ page: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it('aceita search opcional', () => {
    const result = CustomerListParamsSchema.safeParse({ page: 1, limit: 20, search: 'João' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.search).toBe('João');
    }
  });

  it('falha quando limit excede 100', () => {
    const result = CustomerListParamsSchema.safeParse({ page: 1, limit: 101 });
    expect(result.success).toBe(false);
  });

  it('falha quando page é menor que 1', () => {
    const result = CustomerListParamsSchema.safeParse({ page: 0, limit: 20 });
    expect(result.success).toBe(false);
  });
});

describe('AdminCustomerSchema', () => {
  it('valida objeto completo válido', () => {
    const result = AdminCustomerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.role).toBe('customer');
      expect(result.data.isActive).toBe(true);
    }
  });

  it('valida role admin', () => {
    const result = AdminCustomerSchema.safeParse({ ...validCustomer, role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('falha para role inválida', () => {
    const result = AdminCustomerSchema.safeParse({ ...validCustomer, role: 'superuser' });
    expect(result.success).toBe(false);
  });

  it('falha para email inválido', () => {
    const result = AdminCustomerSchema.safeParse({ ...validCustomer, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
