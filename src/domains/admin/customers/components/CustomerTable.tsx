import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';
import type { AdminCustomer } from '../schemas';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface Props {
  customers: AdminCustomer[];
}

export function CustomerTable({ customers }: Props) {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Nenhum cliente encontrado.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Membro desde</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.name}</TableCell>
            <TableCell className="text-muted-foreground">{c.email}</TableCell>
            <TableCell>
              <CustomerStatusBadge isActive={c.isActive} />
            </TableCell>
            <TableCell>{formatDate(c.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Link
                href={`/admin/customers/${c.id}`}
                className="text-sm text-primary hover:underline"
              >
                Ver detalhe →
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
