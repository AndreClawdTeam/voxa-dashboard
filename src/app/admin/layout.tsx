import 'server-only';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { getCurrentUser } from '@/domains/auth/service';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);

  if (!user || user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
