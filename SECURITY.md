# Security

## Relatório de segurança

Se você encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**.
Envie um e-mail para: security@voxa.ai

## Controles implementados

### Autenticação

- JWT com accessToken (curta duração, 15 min) + refreshToken (longa duração, httpOnly cookie)
- Tokens armazenados em cookies httpOnly, Secure (produção), SameSite=Lax
- accessToken em memória no cliente (nunca em localStorage) — via `tokens.ts`
- Auto-refresh transparente no 401: o http-client renova o accessToken via refreshToken
- Middleware Next.js protege todas as rotas `/dashboard` e `/admin`
- Double-check de autenticação server-side no layout `/dashboard` e `/admin`
- Logout limpa todos os cookies server-side via `cookies().delete()`

### Autorização

- RBAC: roles `customer` e `admin`
- Rotas `/admin/*` restritas a `role=admin` (middleware + layout server-side)
- Server Actions validam input via Zod antes de qualquer operação
- IDs de recursos (API keys, customers) validados como UUID antes de chamadas à API

### Dados em trânsito

- HTTPS enforced em produção (cookies com `secure: true` em `NODE_ENV=production`)
- Tokens transmitidos apenas via `Authorization: Bearer` header (nunca query params)
- rawToken de API Keys exibido uma única vez na criação — sem persistência client-side
- Módulo `http-client` marcado com `import 'server-only'` — nunca vai para o bundle do cliente

### Headers HTTP

Configurados via `next.config.ts` para todas as rotas `(.*)`:

| Header                  | Valor                               |
|-------------------------|-------------------------------------|
| X-Frame-Options         | SAMEORIGIN                          |
| X-Content-Type-Options  | nosniff                             |
| X-XSS-Protection        | 1; mode=block                       |
| Referrer-Policy         | strict-origin-when-cross-origin     |
| X-DNS-Prefetch-Control  | on                                  |
| Permissions-Policy      | camera=(), microphone=(), geolocation=() |

### Variáveis de ambiente

- Secrets nunca expostos via `NEXT_PUBLIC_` (apenas `VOXA_API_URL` e `APP_URL` são públicas)
- `.env.local` excluído do git via `.gitignore` (padrão `.env*`)
- Validação de env vars via Zod na inicialização — falha hard em produção se inválido

### Proteção de código servidor

- Todos os services utilizam `import 'server-only'` — nunca bundleados no cliente
- Server Actions com `'use server'` em todos os arquivos de actions
- Logs de erro em produção não expõem estrutura interna de schemas

## Limitações conhecidas

- **Rate limiting de login:** implementado na Voxa API (não no frontend). O frontend confia na resposta HTTP 429 da API para exibir erro ao usuário.
- **CSP (Content-Security-Policy):** não configurado para evitar quebrar assets do Next.js (chunks, inline scripts). Recomenda-se configurar um CSP relatório-only primeiro e iterar.
- **IDOR:** a propriedade dos recursos (API keys, perfil) é enforçada pela Voxa API. O dashboard confia na API como fonte de verdade para autorização de recursos.
