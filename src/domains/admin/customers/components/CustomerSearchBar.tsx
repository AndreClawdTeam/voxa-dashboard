'use client';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';

interface Props {
  initialSearch?: string;
}

export function CustomerSearchBar({ initialSearch = '' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex items-center max-w-sm">
      <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Buscar por nome ou e-mail..."
        defaultValue={initialSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
