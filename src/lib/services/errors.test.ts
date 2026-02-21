import { describe, expect, it } from 'vitest';
import {
  getErrorMessage,
  getFieldErrors,
  isUnauthorizedError,
  isValidationError,
  isVoxaApiError,
  isVoxaNetworkError,
  VoxaApiError,
  VoxaNetworkError,
} from './errors';

describe('VoxaApiError', () => {
  it('é instanciado com os campos corretos', () => {
    const err = new VoxaApiError('Não autorizado', 'UNAUTHORIZED', undefined, 401);
    expect(err.message).toBe('Não autorizado');
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe('VoxaApiError');
    expect(err).toBeInstanceOf(Error);
  });

  it('armazena details de validação', () => {
    const details = [{ field: 'email', message: 'Email inválido' }];
    const err = new VoxaApiError('Validação falhou', 'VALIDATION_ERROR', details, 400);
    expect(err.details).toEqual(details);
  });
});

describe('VoxaNetworkError', () => {
  it('é instanciado corretamente', () => {
    const err = new VoxaNetworkError('Falha na conexão');
    expect(err.message).toBe('Falha na conexão');
    expect(err.name).toBe('VoxaNetworkError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('type guards', () => {
  it('isVoxaApiError identifica VoxaApiError', () => {
    expect(isVoxaApiError(new VoxaApiError('msg', 'CODE'))).toBe(true);
    expect(isVoxaApiError(new Error('msg'))).toBe(false);
    expect(isVoxaApiError(null)).toBe(false);
    expect(isVoxaApiError('string')).toBe(false);
  });

  it('isVoxaNetworkError identifica VoxaNetworkError', () => {
    expect(isVoxaNetworkError(new VoxaNetworkError('msg'))).toBe(true);
    expect(isVoxaNetworkError(new VoxaApiError('msg', 'CODE'))).toBe(false);
  });

  it('isValidationError identifica erros de validação', () => {
    expect(isValidationError(new VoxaApiError('msg', 'VALIDATION_ERROR'))).toBe(true);
    expect(isValidationError(new VoxaApiError('msg', 'UNAUTHORIZED'))).toBe(false);
  });

  it('isUnauthorizedError identifica erros de autenticação', () => {
    expect(isUnauthorizedError(new VoxaApiError('msg', 'UNAUTHORIZED', undefined, 401))).toBe(true);
    expect(isUnauthorizedError(new VoxaApiError('msg', 'NOT_FOUND', undefined, 404))).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('extrai mensagem de VoxaApiError', () => {
    expect(getErrorMessage(new VoxaApiError('Erro de API', 'CODE'))).toBe('Erro de API');
  });

  it('extrai mensagem de VoxaNetworkError', () => {
    expect(getErrorMessage(new VoxaNetworkError('Falha de rede'))).toBe('Falha de rede');
  });

  it('extrai mensagem de Error genérico', () => {
    expect(getErrorMessage(new Error('Erro genérico'))).toBe('Erro genérico');
  });

  it('retorna mensagem padrão para valores desconhecidos', () => {
    expect(getErrorMessage(null)).toBe('Erro inesperado. Tente novamente.');
    expect(getErrorMessage(42)).toBe('Erro inesperado. Tente novamente.');
  });
});

describe('getFieldErrors', () => {
  it('converte details em mapa de campo → mensagem', () => {
    const err = new VoxaApiError('Validação', 'VALIDATION_ERROR', [
      { field: 'email', message: 'Email inválido' },
      { field: 'password', message: 'Mínimo 8 caracteres' },
    ]);
    expect(getFieldErrors(err)).toEqual({
      email: 'Email inválido',
      password: 'Mínimo 8 caracteres',
    });
  });

  it('retorna objeto vazio para não-validação error', () => {
    expect(getFieldErrors(new VoxaApiError('msg', 'UNAUTHORIZED'))).toEqual({});
    expect(getFieldErrors(null)).toEqual({});
  });
});
