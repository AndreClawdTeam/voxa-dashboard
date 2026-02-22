import Link from 'next/link';
import { LogoutButton } from '@/domains/auth/components/LogoutButton';
import type { AdminIconName } from './AdminNavButton';
import { AdminNavButton } from './AdminNavButton';

const navItems: Array<{ href: string; label: string; iconName: AdminIconName }> = [
  { href: '/admin/customers', label: 'Clientes', iconName: 'customers' },
  { href: '/admin/audit-logs', label: 'Audit Logs', iconName: 'audit-logs' },
];

export function AdminSidebar() {
  return (
    <aside className="w-56 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <span className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
          Admin Panel
        </span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, iconName }) => (
          <AdminNavButton key={href} href={href} label={label} iconName={iconName} />
        ))}
      </nav>
      <div className="p-4 border-t flex flex-col gap-2">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar ao dashboard
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
