'use client';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  initialSearch?: string;
}

export function CustomerSearchBar({ initialSearch = '' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set('search', value.trim());
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative flex items-center max-w-sm">
      <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Buscar por nome ou e-mail..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0"
          onClick={() => setValue('')}
        >
          <X size={12} />
        </Button>
      )}
    </div>
  );
}
