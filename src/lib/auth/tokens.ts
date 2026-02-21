'use client'; // este arquivo pode ser importado em Client Components

// ─── Client-side token store (memória — nunca localStorage por segurança) ────

let _clientAccessToken: string | null = null;

export function getClientAccessToken(): string | null {
  return _clientAccessToken;
}

export function setClientAccessToken(token: string): void {
  _clientAccessToken = token;
}

export function clearClientTokens(): void {
  _clientAccessToken = null;
}
