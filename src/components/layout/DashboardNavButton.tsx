'use client';

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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Mapa interno: string → ícone do lucide
// Nunca exportar este mapa — é detalhe de implementação do NavButton
const ICON_MAP = {
  dashboard: LayoutDashboard,
  quickstart: Zap,
  'api-keys': Key,
  transcriptions: FileText,
  profile: User,
  subscription: CreditCard,
  customers: Users,
  'audit-logs': ClipboardList,
} as const;

export type DashboardIconName = keyof typeof ICON_MAP;

interface DashboardNavButtonProps {
  href: string;
  label: string;
  iconName: DashboardIconName;
  /** When true, only matches the exact path (not sub-paths) */
  exactMatch?: boolean;
}

export function DashboardNavButton({ href, label, iconName, exactMatch }: DashboardNavButtonProps) {
  const pathname = usePathname();
  const isActive = exactMatch
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICON_MAP[iconName];

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-accent text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
