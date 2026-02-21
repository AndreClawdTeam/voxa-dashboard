import { ScrollText, Users } from 'lucide-react';
import Link from 'next/link';

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
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Icon size={16} />
            {label}
          </Link>
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
