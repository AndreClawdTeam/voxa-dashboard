import type { AdminCustomerDetail } from '../schemas';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface Props {
  customer: AdminCustomerDetail;
}

export function CustomerProfileSection({ customer }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Nome</span>
        <span className="font-medium">{customer.name}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">E-mail</span>
        <span>{customer.email}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Role</span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            customer.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {customer.role === 'admin' ? 'Admin' : 'Cliente'}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Status da conta</span>
        <CustomerStatusBadge isActive={customer.isActive} />
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Membro desde</span>
        <span>
          {new Date(customer.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  );
}
