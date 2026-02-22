'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RESOURCE_TYPE_OPTIONS } from '../helpers';

interface Props {
  initialFilters: {
    action?: string;
    resourceType?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function AuditLogFilters({ initialFilters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.replace(pathname);
  }

  const hasFilters = !!(
    initialFilters.action ||
    initialFilters.resourceType ||
    initialFilters.startDate ||
    initialFilters.endDate
  );

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1">
        <label htmlFor="filter-action" className="text-xs text-muted-foreground">
          Ação
        </label>
        <Input
          id="filter-action"
          placeholder="Ex: subscription.upgraded"
          defaultValue={initialFilters.action ?? ''}
          className="h-8 text-sm w-48"
          onBlur={(e) => updateParam('action', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateParam('action', (e.target as HTMLInputElement).value);
          }}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-resource-type" className="text-xs text-muted-foreground">
          Tipo de recurso
        </label>
        <Select
          defaultValue={initialFilters.resourceType ?? ''}
          onValueChange={(v) => updateParam('resourceType', v)}
        >
          <SelectTrigger id="filter-resource-type" className="h-8 text-sm w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            {RESOURCE_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-start-date" className="text-xs text-muted-foreground">
          Data início
        </label>
        <Input
          id="filter-start-date"
          type="date"
          defaultValue={initialFilters.startDate ?? ''}
          className="h-8 text-sm w-36"
          onChange={(e) => updateParam('startDate', e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="filter-end-date" className="text-xs text-muted-foreground">
          Data fim
        </label>
        <Input
          id="filter-end-date"
          type="date"
          defaultValue={initialFilters.endDate ?? ''}
          className="h-8 text-sm w-36"
          onChange={(e) => updateParam('endDate', e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearAll}>
          Limpar filtros ×
        </Button>
      )}
    </div>
  );
}
