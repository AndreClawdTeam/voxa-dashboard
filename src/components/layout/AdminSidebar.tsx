'use client';

import { ScrollText, Users } from 'lucide-react';
import Link from 'next/link';
import { AdminNavButton } from './AdminNavButton';

const navItems = [
  { href: '/admin/customers', label: 'Clientes', icon: Users },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
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
        {navItems.map(({ href, label, icon }) => (
          <AdminNavButton key={href} href={href} label={label} icon={icon} />
        ))}
      </nav>
      <div className="p-4 border-t">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Voltar ao dashboard
        </Link>
      </div>
    </aside>
  );
}
