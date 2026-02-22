'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardNavButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** When true, only matches the exact path (not sub-paths) */
  exactMatch?: boolean;
}

export function DashboardNavButton({
  href,
  label,
  icon: Icon,
  exactMatch,
}: DashboardNavButtonProps) {
  const pathname = usePathname();
  const isActive = exactMatch
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

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
