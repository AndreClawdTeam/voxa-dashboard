import type { NextConfig } from 'next';

const VOXA_API_URL = process.env.NEXT_PUBLIC_VOXA_API_URL ?? '';

// Content-Security-Policy diretivas
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline' é necessário para o Next.js (inline scripts de hydration).
  // 'unsafe-eval' foi removido — não é necessário no Next.js 15+ e representa risco de segurança.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${VOXA_API_URL}`.trim(),
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  // Previne clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Previne MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Controla informações de referrer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desabilita acesso a camera, mic e geolocalização
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // DNS prefetch para performance
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Content-Security-Policy: defesa em profundidade contra XSS
  { key: 'Content-Security-Policy', value: cspDirectives },
];

// HSTS só em produção — HTTPS enforced por 2 anos
if (process.env.NODE_ENV === 'production') {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
}

const nextConfig: NextConfig = {
  // Headers de segurança para todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
