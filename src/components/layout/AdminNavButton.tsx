'use client';

import { ScrollText, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_ICON_MAP = {
  customers: Users,
  'audit-logs': ScrollText,
} as const;

export type AdminIconName = keyof typeof ADMIN_ICON_MAP;

interface AdminNavButtonProps {
  href: string;
  label: string;
  iconName: AdminIconName;
}

export function AdminNavButton({ href, label, iconName }: AdminNavButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ADMIN_ICON_MAP[iconName];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'hover:bg-accent hover:text-accent-foreground',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
