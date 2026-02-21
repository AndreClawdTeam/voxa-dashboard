import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/** Format a date string as dd/MM/yyyy HH:mm (pt-BR) */
export function formatDateTime(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/** Format a date string as dd/MM/yyyy (pt-BR) */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
}
