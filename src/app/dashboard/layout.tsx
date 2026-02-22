import 'server-only';
import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { requireAuth } from '@/lib/auth/require-auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Double-check server-side: garante que apenas usuários autenticados acessam o dashboard
  // (além da proteção do middleware). requireAuth() redireciona para /login se necessário.
  const user = await requireAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar userRole={user.role} />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
