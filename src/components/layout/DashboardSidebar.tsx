import {
  ClipboardList,
  CreditCard,
  FileText,
  Key,
  LayoutDashboard,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { LogoutButton } from '@/domains/auth/components/LogoutButton';
import { DashboardNavButton } from './DashboardNavButton';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exactMatch: true },
  { href: '/dashboard/quickstart', label: 'Quickstart', icon: Zap },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/transcriptions', label: 'Transcrições', icon: FileText },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
  { href: '/dashboard/subscription', label: 'Assinatura', icon: CreditCard },
];

const adminNavItems = [
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
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
            icon={item.icon}
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
                icon={item.icon}
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
