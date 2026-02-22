import 'server-only';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { requireAdmin } from '@/lib/auth/require-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // requireAdmin() verifica autenticação + role=admin,
  // redirecionando para /login ou /dashboard conforme o caso.
  await requireAdmin();

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
