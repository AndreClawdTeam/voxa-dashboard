/**
 * Tipo padrão de retorno para Server Actions com validação de formulário.
 * E = formato do campo error (padrão: Record<string, string[]> para field errors)
 */
export type ActionResult<E = Record<string, string[]>> =
  | { success: true }
  | { success: false; error: E };

/**
 * Helper para extrair mensagem de erro genérica de um ActionResult.
 */
export function getActionError<E>(result: { success: false; error: E }): E {
  return result.error;
}
