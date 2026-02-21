/**
 * Tipo padrão de retorno para Server Actions com validação de formulário.
 * E = formato do campo error (padrão: Record<string, string[]> para field errors)
 *
 * `fields` preserva os valores digitados pelo usuário para que o cliente possa
 * setar `defaultValue` no input sem precisar de `useState`.
 * Nunca incluir campos sensíveis (password) em `fields`.
 */
export type ActionResult<E = Record<string, string[]>> =
  | { success: true }
  | { success: false; error: E; fields?: Record<string, string> };

/**
 * Helper para extrair mensagem de erro genérica de um ActionResult.
 */
export function getActionError<E>(result: { success: false; error: E }): E {
  return result.error;
}
