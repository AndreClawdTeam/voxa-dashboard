'use client';

import { CreditCard, FileText, Key, LayoutDashboard, User } from 'lucide-react';
import { DashboardNavButton } from './DashboardNavButton';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exactMatch: true },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  { href: '/dashboard/transcriptions', label: 'Transcrições', icon: FileText },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
  { href: '/dashboard/subscription', label: 'Assinatura', icon: CreditCard },
];

export function DashboardSidebar() {
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
      </nav>
    </aside>
  );
}
