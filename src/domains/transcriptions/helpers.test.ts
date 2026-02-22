import { describe, expect, it } from 'vitest';
import { formatDuration, formatFileSize, getStatusColor, getStatusLabel } from './helpers';

describe('formatDuration', () => {
  it('deve formatar 0 segundos', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('deve formatar segundos < 60', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(1)).toBe('1s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('deve formatar minutos e segundos (60-3599)', () => {
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(60)).toBe('1m 0s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('deve formatar horas e minutos (3600+)', () => {
    expect(formatDuration(3661)).toBe('1h 1m');
    expect(formatDuration(3600)).toBe('1h 0m');
    expect(formatDuration(7200)).toBe('2h 0m');
  });
});

describe('formatFileSize', () => {
  it('deve formatar bytes < 1024', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1023)).toBe('1023 B');
  });

  it('deve formatar KB (1024 - 1048575)', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('deve formatar MB (1048576+)', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(2097152)).toBe('2.0 MB');
  });
});

describe('getStatusColor', () => {
  it('deve retornar cores corretas por status', () => {
    expect(getStatusColor('pending')).toBe('bg-gray-100 text-gray-700');
    expect(getStatusColor('processing')).toBe('bg-blue-100 text-blue-700');
    expect(getStatusColor('completed')).toBe('bg-green-100 text-green-700');
    expect(getStatusColor('failed')).toBe('bg-red-100 text-red-700');
  });
});

describe('getStatusLabel', () => {
  it('deve retornar rótulos em PT-BR', () => {
    expect(getStatusLabel('pending')).toBe('Pendente');
    expect(getStatusLabel('processing')).toBe('Processando');
    expect(getStatusLabel('completed')).toBe('Concluída');
    expect(getStatusLabel('failed')).toBe('Falhou');
  });
});
