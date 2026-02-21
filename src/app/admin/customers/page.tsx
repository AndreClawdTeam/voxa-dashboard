import type { SearchParams } from 'next/dist/server/request/search-params';
import { AdminPagination } from '@/domains/admin/customers/components/AdminPagination';
import { CustomerSearchBar } from '@/domains/admin/customers/components/CustomerSearchBar';
import { CustomerTable } from '@/domains/admin/customers/components/CustomerTable';
import { listCustomers } from '@/domains/admin/customers/service';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clientes — Admin Voxa' };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = typeof params.search === 'string' ? params.search.slice(0, 100) : undefined;

  const { data: customers, pagination } = await listCustomers({ page, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{pagination.total} clientes cadastrados</p>
        </div>
      </div>

      <CustomerSearchBar initialSearch={search ?? ''} />

      <CustomerTable customers={customers} />

      <AdminPagination pagination={pagination} currentPage={page} />
    </div>
  );
}
