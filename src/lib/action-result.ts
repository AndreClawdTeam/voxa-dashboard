import type { ActionResult } from './actions';

/**
 * ActionResult com field errors (padrão para formulários com validação por campo).
 * Alias de ActionResult<Record<string, string[]>>.
 */
export type FieldActionResult = ActionResult<Record<string, string[]>>;

/**
 * ActionResult com mensagem de erro simples (string).
 * Alias de ActionResult<string>.
 */
export type SimpleActionResult = ActionResult<string>;

/**
 * ActionResult com dados no sucesso.
 * Manter local para casos com `{ success: true; data: T }`.
 */
export type DataActionResult<T> = { success: true; data: T } | { success: false; error: string };

/** Helper para extrair field errors de um Zod flatten */
export function fieldErrors(
  flattenedErrors: Record<string, string[] | undefined>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(flattenedErrors).filter(([, v]) => v !== undefined),
  ) as Record<string, string[]>;
}
