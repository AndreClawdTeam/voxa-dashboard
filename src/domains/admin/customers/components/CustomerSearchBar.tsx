'use client';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  initialSearch?: string;
}

export function CustomerSearchBar({ initialSearch = '' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (rawValue: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (rawValue.trim()) {
          params.set('search', rawValue.trim());
        } else {
          params.delete('search');
        }
        params.set('page', '1');
        router.replace(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [pathname, router, searchParams],
  );

  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    handleSearch('');
  }, [handleSearch]);

  return (
    <div className="relative flex items-center max-w-sm">
      <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder="Buscar por nome ou e-mail..."
        defaultValue={initialSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-8"
      />
      {initialSearch && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 h-6 w-6 p-0"
          onClick={handleClear}
        >
          <X size={12} />
        </Button>
      )}
    </div>
  );
}
