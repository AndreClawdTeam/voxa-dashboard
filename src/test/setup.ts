import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Limpa localStorage entre testes para evitar vazamento de estado
afterEach(() => {
  localStorage.clear();
});

// Mock server-only para ambiente de teste (Vitest roda em Node, não Next.js)
vi.mock('server-only', () => ({}));

// Mock do next/headers para testes de Server Actions/http-client
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock do next/navigation — obrigatório para componentes que usam useRouter, etc.
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/dashboard'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

// Mock do next/cache para Server Actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
