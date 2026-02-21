import 'server-only';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { getCurrentUser } from '@/domains/auth/service';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Double-check server-side: garante que apenas usuários autenticados acessam o dashboard
  // (além da proteção do middleware)
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
