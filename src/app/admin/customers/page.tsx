import { AdminPagination } from '@/domains/admin/customers/components/AdminPagination';
import { CustomerSearchBar } from '@/domains/admin/customers/components/CustomerSearchBar';
import { CustomerTable } from '@/domains/admin/customers/components/CustomerTable';
import { CustomerListParamsSchema } from '@/domains/admin/customers/schemas';
import { listCustomers } from '@/domains/admin/customers/service';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Clientes — Admin Voxa' };

type PageSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const params = await searchParams;
  const parsed = CustomerListParamsSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : { page: 1, limit: 20 };

  const { data: customers, pagination } = await listCustomers({
    page: filters.page,
    search: filters.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">{pagination.total} clientes cadastrados</p>
        </div>
      </div>

      <CustomerSearchBar initialSearch={filters.search ?? ''} />

      <CustomerTable customers={customers} />

      <AdminPagination pagination={pagination} currentPage={filters.page} />
    </div>
  );
}
