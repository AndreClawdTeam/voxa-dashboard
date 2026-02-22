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

/** Format a date string as "MMMM 'de' yyyy" (pt-BR), e.g. "fevereiro de 2026" */
export function formatMonthYear(dateStr: string): string {
  return format(new Date(dateStr), "MMMM 'de' yyyy", { locale: ptBR });
}

/** Format a date string as "dd 'de' MMMM 'de' yyyy" (pt-BR), e.g. "15 de janeiro de 2024" */
export function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}
