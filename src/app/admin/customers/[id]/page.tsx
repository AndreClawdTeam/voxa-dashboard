import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerProfileSection } from '@/domains/admin/customers/components/CustomerProfileSection';
import { CustomerSubscriptionSection } from '@/domains/admin/customers/components/CustomerSubscriptionSection';
import { ManageSubscriptionForm } from '@/domains/admin/customers/components/ManageSubscriptionForm';
import type { AdminCustomerDetail } from '@/domains/admin/customers/schemas';
import { getCustomer } from '@/domains/admin/customers/service';

export const dynamic = 'force-dynamic';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let customer: AdminCustomerDetail;
  try {
    customer = await getCustomer(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/admin/customers" className="hover:text-foreground">
          Clientes
        </Link>
        <span>›</span>
        <span className="text-foreground">{customer.name}</span>
      </nav>

      <h1 className="text-2xl font-bold">{customer.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerProfileSection customer={customer} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinatura atual</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSubscriptionSection customer={customer} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageSubscriptionForm customer={customer} customerId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
