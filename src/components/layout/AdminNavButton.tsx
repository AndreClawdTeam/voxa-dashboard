'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminNavButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export function AdminNavButton({ href, label, icon: Icon }: AdminNavButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

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
