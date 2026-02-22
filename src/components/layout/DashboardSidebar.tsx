import { LogoutButton } from '@/domains/auth/components/LogoutButton';
import type { DashboardIconName } from './DashboardNavButton';
import { DashboardNavButton } from './DashboardNavButton';

const navItems: Array<{
  href: string;
  label: string;
  iconName: DashboardIconName;
  exactMatch?: boolean;
}> = [
  { href: '/dashboard', label: 'Overview', iconName: 'dashboard', exactMatch: true },
  { href: '/dashboard/quickstart', label: 'Quickstart', iconName: 'quickstart' },
  { href: '/dashboard/api-keys', label: 'API Keys', iconName: 'api-keys' },
  { href: '/dashboard/transcriptions', label: 'Transcrições', iconName: 'transcriptions' },
  { href: '/dashboard/profile', label: 'Perfil', iconName: 'profile' },
  { href: '/dashboard/subscription', label: 'Assinatura', iconName: 'subscription' },
];

const adminNavItems: Array<{ href: string; label: string; iconName: DashboardIconName }> = [
  { href: '/admin/customers', label: 'Clientes', iconName: 'customers' },
  { href: '/admin/audit-logs', label: 'Audit Logs', iconName: 'audit-logs' },
];

interface DashboardSidebarProps {
  userRole?: string;
}

export function DashboardSidebar({ userRole }: DashboardSidebarProps) {
  const isAdmin = userRole === 'admin';

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <span className="font-semibold text-foreground">Voxa Dashboard</span>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <DashboardNavButton
            key={item.href}
            href={item.href}
            label={item.label}
            iconName={item.iconName}
            exactMatch={item.exactMatch}
          />
        ))}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin
              </span>
            </div>
            {adminNavItems.map((item) => (
              <DashboardNavButton
                key={item.href}
                href={item.href}
                label={item.label}
                iconName={item.iconName}
              />
            ))}
          </>
        )}
      </nav>
      <div className="p-2 border-t border-border">
        <LogoutButton />
      </div>
    </aside>
  );
}
