export interface ValidationDetail {
  field: string;
  message: string;
}

export class VoxaApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: ValidationDetail[],
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'VoxaApiError';
  }
}

export class VoxaNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VoxaNetworkError';
  }
}

export function isVoxaApiError(error: unknown): error is VoxaApiError {
  return error instanceof VoxaApiError;
}

export function isVoxaNetworkError(error: unknown): error is VoxaNetworkError {
  return error instanceof VoxaNetworkError;
}

export function isValidationError(error: unknown): error is VoxaApiError {
  return isVoxaApiError(error) && error.code === 'VALIDATION_ERROR';
}

export function isUnauthorizedError(error: unknown): error is VoxaApiError {
  return isVoxaApiError(error) && (error.code === 'UNAUTHORIZED' || error.statusCode === 401);
}

/** Extrai a mensagem de erro de qualquer tipo de erro */
export function getErrorMessage(error: unknown): string {
  if (isVoxaApiError(error)) return error.message;
  if (isVoxaNetworkError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Erro inesperado. Tente novamente.';
}

/** Extrai erros de campo de um VoxaApiError de validação — para formulários */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!isValidationError(error) || !error.details) return {};
  return error.details.reduce<Record<string, string>>((acc, detail) => {
    acc[detail.field] = detail.message;
    return acc;
  }, {});
}
