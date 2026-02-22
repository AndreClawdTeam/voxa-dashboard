# voxa-dashboard — CLAUDE.md Técnico

> **Leia este documento ANTES de escrever qualquer linha de código.**
> Gerado por: Johnny Juvenil (Tech Lead) — baseado em pesquisa de melhores práticas 2025.

---

## Seção 1 — Visão do Produto

O **voxa-dashboard** é o portal web de autoatendimento da Voxa API — uma API de transcrição de áudio com planos de assinatura (trial, basic, pro).

**Problema que resolve:**
- Clientes (devs e empresas) precisam gerenciar suas integrações com a Voxa API sem depender do suporte: criar/revogar API keys, acompanhar uso mensal, visualizar transcrições realizadas e gerenciar sua assinatura.
- A equipe Voxa (admins) precisa de uma ferramenta para auditar clientes, gerenciar assinaturas e investigar problemas operacionais.

**O que é:**
Dashboard web com dois portais distintos — Customer Portal e Admin Panel — consumindo a Voxa API como única fonte de verdade.

**O que não é:**
Não é um produto separado. É a camada de UI sobre a Voxa API. Toda lógica de negócio vive na API.

### Escopo Técnico
- **Frontend only:** zero lógica de negócio neste repo; toda validação de regras de negócio é responsabilidade da Voxa API
- **Consome REST API:** todos os dados vêm de `NEXT_PUBLIC_VOXA_API_URL`
- **Stateless:** o estado de sessão é gerenciado via cookies HttpOnly + JWT access token em memória

### Personas

#### 🧑‍💻 Customer — Desenvolvedor / Empresa
- Trial de 7 dias após registro
- Cria e revoga API keys para integrar no seu produto
- Monitora uso (transcrições/mês, rate limit por plano: 20/60/300 req/min)
- Visualiza histórico de transcrições para debugging
- Gerencia plano (trial → basic → pro)

#### 🛡️ Admin — Equipe interna Voxa
- `role: admin` na Voxa API
- Investiga clientes, audita ações, gerencia assinaturas

### Features

| Portal | Feature |
|--------|---------|
| Customer | Overview: métricas de uso, rate limit, trial countdown |
| Customer | API Keys: listar, criar (rawToken 1x), revogar |
| Customer | Transcrições: lista paginada, filtros, detalhe |
| Customer | Perfil: visualizar e editar |
| Customer | Assinatura: plano atual, upgrade |
| Admin | Lista de clientes com busca e filtros |
| Admin | Detalhe do cliente + gestão de assinatura |
| Admin | Audit logs com filtros por ação/data/recurso |

### Non-Goals v1
- ❌ Billing / pagamento real (sem Stripe)
- ❌ Upload de áudio no dashboard
- ❌ Multi-tenancy / equipes
- ❌ Notificações em tempo real (WebSocket/SSE)
- ❌ Exportação de dados (CSV/PDF)
- ❌ Internacionalização (i18n)

---

## Seção 2 — Arquitetura

### Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                        │
│                                                                  │
│  ┌──────────────────┐    ┌─────────────────────────────────┐   │
│  │  Client Components│    │    React Context (AuthContext)   │   │
│  │  (LoginForm,      │◄──►│    hooks (useAuth, useFormState) │   │
│  │   CreateKeyDialog,│    │    useState, useEffect, onClick  │   │
│  │   RawTokenReveal) │    └─────────────────────────────────┘   │
│  └──────────┬────────┘                                          │
└─────────────│────────────────────────────────────────────────────┘
              │ HTTP POST (Server Action invoke)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Next.js)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   middleware.ts                           │   │
│  │  /dashboard/* → verifica accessToken cookie              │   │
│  │  /admin/*     → verifica accessToken + role=admin cookie  │   │
│  │  Redirect → /login se não autenticado                    │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │               App Router (Server Components)              │   │
│  │                                                           │   │
│  │  app/dashboard/page.tsx        → async Server Component   │   │
│  │  app/dashboard/api-keys/page.tsx → chama service diretamente│  │
│  │  app/admin/customers/page.tsx  → async Server Component   │   │
│  │                                                           │   │
│  │  ⚡ Roda no servidor: sem useState, sem useEffect        │   │
│  │  ⚡ Busca dados diretamente dos services                  │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │                   Server Actions                          │   │
│  │                                                           │   │
│  │  domains/*/actions.ts          → 'use server'            │   │
│  │  1. Valida input com Zod (safeParse)                     │   │
│  │  2. Chama service correspondente                          │   │
│  │  3. revalidatePath() se necessário                        │   │
│  │  4. Retorna { data } ou { error }                         │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Service Layer (lib/services/)                │   │
│  │                                                           │   │
│  │  voxaFetch<T>(endpoint, { schema, ...options })          │   │
│  │  ├── Adiciona Authorization: Bearer <accessToken>        │   │
│  │  ├── Executa fetch()                                      │   │
│  │  ├── 401? → refresh token → retry automático             │   │
│  │  ├── Valida resposta com schema Zod (nunca 'as Type')     │   │
│  │  └── Retorna T validado ou lança VoxaApiError            │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────│────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Voxa API                                  │
│              (NEXT_PUBLIC_VOXA_API_URL)                         │
│                                                                  │
│  POST /api/v1/auth/login   → { data: { accessToken } }         │
│                              + Set-Cookie: refreshToken HttpOnly │
│  GET  /api/v1/keys         → { data: ApiKey[] }                │
│  GET  /api/v1/admin/*      → role=admin required               │
└─────────────────────────────────────────────────────────────────┘
```

### Separação Server vs Client

| Responsabilidade | Onde Roda | Exemplos |
|-----------------|-----------|---------|
| Busca de dados (fetch) | **Servidor** | `app/dashboard/page.tsx` async component |
| Mutações (create/update/delete) | **Servidor** | `domains/*/actions.ts` com `'use server'` |
| HTTP client | **Servidor** | `lib/services/http-client.ts` |
| Proteção de rotas | **Servidor** | `middleware.ts` |
| Estado local UI | **Cliente** | `useState`, `useReducer` |
| Interatividade | **Cliente** | `onClick`, `onChange`, modais |
| Estado global de auth | **Cliente** | `AuthContext` com `'use client'` |
| Animações e transições | **Cliente** | framer-motion, CSS transitions |

### Fluxo de Autenticação

```
1. REGISTRO / LOGIN
   Browser → POST /api/v1/auth/login
   Voxa API → { data: { accessToken } } + Set-Cookie: refreshToken (HttpOnly)
   Client → armazena accessToken em memória (AuthContext) + cookie role para middleware

2. REQUEST AUTENTICADO
   Server Component / Action → voxaFetch(endpoint, { schema })
   voxaFetch → adiciona Authorization: Bearer <accessToken>
   Voxa API → 200 { data: T }

3. TOKEN EXPIRADO (401)
   voxaFetch → captura 401
   voxaFetch → POST /api/v1/auth/refresh (cookie refreshToken vai automaticamente)
   Voxa API → { data: { accessToken } } novo
   voxaFetch → atualiza token → retry original request

4. LOGOUT
   logoutAction → POST /api/v1/auth/logout (invalida refresh na API)
   logoutAction → limpa cookies de sessão
   Redirect → /login

5. MIDDLEWARE (a cada request para /dashboard/* ou /admin/*)
   middleware.ts → lê cookie accessToken
   Se ausente → redirect /login
   Se /admin/* → lê cookie userRole
   Se role !== 'admin' → redirect /dashboard
```

### Formato da Voxa API

```typescript
// Sucesso (item único)
{ "data": T }

// Sucesso (lista paginada)
{
  "data": T[],
  "pagination": {
    "page": number,
    "perPage": number,
    "total": number,
    "totalPages": number
  }
}

// Erro
{
  "error": string,
  "code": string,
  "details"?: Array<{ field: string; message: string }>
}
```

---

## Seção 3 — Tech Stack

| Tecnologia | Versão | Justificativa |
|-----------|--------|--------------|
| **Next.js** | 16.x (App Router) | Framework principal; App Router com Server Components, Server Actions e middleware nativo. RSC reduz bundle JS no cliente. |
| **TypeScript** | 5.x strict | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Zero `any`, zero type assertions. |
| **React** | 19.x | `useActionState`, `useFormStatus`, `use()` hook para Promises. |
| **Zod** | 4.x | Validação runtime + inferência de tipos. Schema = source of truth. Nunca `as Type`. |
| **shadcn/ui** | latest | Componentes acessíveis, copiáveis, tema dark. Baseado em Radix UI + Tailwind CSS. Funciona como Server Components (Card, Table, Badge) e Client (Dialog, Sheet, DropdownMenu). |
| **Tailwind CSS** | 4.x | Utility-first; integrado ao shadcn/ui. |
| **Biome** | 2.x | Linter + formatter em um binário Rust. 10-100x mais rápido que ESLint+Prettier. Zero config duplicada. |
| **Vitest** | 4.x | Test runner ESM-native, API compatível com Jest, integração nativa com Vite/Next.js. |
| **React Testing Library** | latest | Testa comportamento, não implementação. `getByRole`, `userEvent`. |
| **sonner** | 2.x | Toast notifications. Chamado dentro do wrapper do `useActionState`, nunca em `useEffect`. |

> ⚠️ **Sem react-hook-form, sem MSW.** Formulários usam `useActionState` + `<form action={action}>` (padrão React 19 nativo). Testes de actions usam `vi.mock` do Vitest — não há intercepção de fetch em nível de service worker.

---

## Seção 4 — Estrutura de Pastas

> Baseada em DDD (Domain-Driven Design) adaptado para Next.js App Router.
> Princípio: código do mesmo domínio junto. Não separar por tipo de arquivo.

```
voxa-dashboard/
├── src/
│   ├── app/                              # Next.js App Router — APENAS roteamento e layouts
│   │   ├── (auth)/                       # Route group público (sem layout de dashboard)
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Renderiza <LoginForm />
│   │   │   └── register/
│   │   │       └── page.tsx              # Renderiza <RegisterForm />
│   │   ├── dashboard/                    # Protegido por middleware — customers
│   │   │   ├── layout.tsx                # DashboardLayout: sidebar + header
│   │   │   ├── page.tsx                  # Overview: métricas + trial countdown
│   │   │   ├── api-keys/
│   │   │   │   └── page.tsx              # Gerenciamento de API Keys
│   │   │   ├── transcriptions/
│   │   │   │   ├── page.tsx              # Lista paginada de transcrições
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detalhe da transcrição
│   │   │   ├── profile/
│   │   │   │   └── page.tsx              # Perfil do usuário
│   │   │   └── subscription/
│   │   │       └── page.tsx              # Assinatura + upgrade
│   │   ├── admin/                        # Protegido por middleware — role=admin only
│   │   │   ├── layout.tsx                # AdminLayout: sidebar admin + header
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx              # Lista de clientes com busca/filtros
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Detalhe + gestão de assinatura
│   │   │   └── audit-logs/
│   │   │       └── page.tsx              # Audit logs com filtros na URL
│   │   ├── layout.tsx                    # Root layout: providers, fonts, metadata
│   │   ├── globals.css                   # Tailwind base + shadcn/ui CSS vars
│   │   └── not-found.tsx                 # Página 404 customizada
│   │
│   ├── domains/                          # DDD — código agrupado por domínio de negócio
│   │   ├── auth/
│   │   │   ├── schemas.ts                # LoginSchema, RegisterSchema (Zod)
│   │   │   ├── types.ts                  # z.infer<> dos schemas + User, AuthState
│   │   │   ├── service.ts                # loginUser(), registerUser(), refreshToken(), me()
│   │   │   ├── actions.ts                # loginAction(), registerAction(), logoutAction()
│   │   │   ├── context.tsx               # AuthContext + AuthProvider ('use client')
│   │   │   └── components/
│   │   │       ├── LoginForm.tsx         # 'use client' — useActionState, react-hook-form
│   │   │       └── RegisterForm.tsx      # 'use client' — useActionState, react-hook-form
│   │   │
│   │   ├── api-keys/
│   │   │   ├── schemas.ts                # CreateApiKeySchema, ApiKeySchema, RevokeSchema
│   │   │   ├── types.ts                  # ApiKey, CreateApiKeyResult (com rawToken)
│   │   │   ├── service.ts                # fetchApiKeys(), createApiKey(), revokeApiKey()
│   │   │   ├── actions.ts                # createApiKeyAction(), revokeApiKeyAction()
│   │   │   └── components/
│   │   │       ├── ApiKeysTable.tsx      # Server Component — renderiza lista
│   │   │       ├── ApiKeysPageClient.tsx # 'use client' — gerencia estado do modal
│   │   │       ├── CreateApiKeyDialog.tsx # 'use client' — Dialog com form
│   │   │       ├── RawTokenReveal.tsx    # 'use client' — CRÍTICO: exibe token 1x
│   │   │       └── RevokeKeyButton.tsx   # 'use client' — confirm + action
│   │   │
│   │   ├── transcriptions/
│   │   │   ├── schemas.ts                # TranscriptionSchema, TranscriptionListSchema
│   │   │   ├── types.ts                  # Transcription, TranscriptionDetail
│   │   │   ├── service.ts                # fetchTranscriptions(), fetchTranscription()
│   │   │   └── components/
│   │   │       ├── TranscriptionsList.tsx      # Server Component
│   │   │       ├── TranscriptionFilters.tsx    # 'use client' — filtros com URL params
│   │   │       ├── TranscriptionDetail.tsx     # Server Component
│   │   │       └── PaginationControls.tsx      # 'use client' — navegação de páginas
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── schemas.ts                # SubscriptionSchema, UpgradeSchema
│   │   │   ├── types.ts                  # Subscription, Plan, TrialStatus
│   │   │   ├── service.ts                # fetchSubscription(), upgradeSubscription()
│   │   │   ├── actions.ts                # upgradeAction()
│   │   │   └── components/
│   │   │       ├── SubscriptionCard.tsx        # Server Component
│   │   │       ├── TrialCountdown.tsx           # 'use client' — timer visual progressivo
│   │   │       ├── PlanComparison.tsx           # Server Component
│   │   │       └── UpgradeButton.tsx            # 'use client' — confirm + action
│   │   │
│   │   ├── usage/
│   │   │   ├── schemas.ts                # UsageSchema
│   │   │   ├── types.ts                  # UsageMetrics, RateLimitInfo
│   │   │   ├── service.ts                # fetchUsage()
│   │   │   └── components/
│   │   │       ├── UsageOverviewCards.tsx      # Server Component — métricas
│   │   │       └── RateLimitBar.tsx            # Server Component — barra de progresso
│   │   │
│   │   ├── profile/
│   │   │   ├── schemas.ts                # ProfileSchema, UpdateProfileSchema
│   │   │   ├── types.ts                  # Profile
│   │   │   ├── service.ts                # fetchProfile(), updateProfile()
│   │   │   ├── actions.ts                # updateProfileAction()
│   │   │   └── components/
│   │   │       ├── ProfileView.tsx             # Server Component — dados atuais
│   │   │       └── ProfileEditForm.tsx         # 'use client' — form de edição
│   │   │
│   │   └── admin/
│   │       ├── customers/
│   │       │   ├── schemas.ts            # CustomerSchema, CustomerListSchema, SubscriptionUpdateSchema
│   │       │   ├── types.ts              # AdminCustomer, CustomerDetail
│   │       │   ├── service.ts            # fetchCustomers(), fetchCustomer(), updateSubscription()
│   │       │   ├── actions.ts            # updateSubscriptionAction()
│   │       │   └── components/
│   │       │       ├── CustomersList.tsx         # Server Component
│   │       │       ├── CustomerFilters.tsx       # 'use client' — filtros na URL
│   │       │       ├── CustomerDetail.tsx        # Server Component
│   │       │       └── SubscriptionManager.tsx   # 'use client' — gestão de assinatura
│   │       │
│   │       └── audit-logs/
│   │           ├── schemas.ts            # AuditLogSchema, AuditLogListSchema
│   │           ├── types.ts              # AuditLog, AuditLogFilter
│   │           ├── service.ts            # fetchAuditLogs()
│   │           └── components/
│   │               ├── AuditLogsList.tsx         # Server Component
│   │               ├── AuditLogFilters.tsx       # 'use client' — filtros na URL
│   │               └── AuditLogDetail.tsx        # 'use client' — metadata expandível
│   │
│   ├── components/                       # Componentes compartilhados (não-domínio)
│   │   ├── ui/                           # shadcn/ui — GERADOS, não editar manualmente
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── DashboardSidebar.tsx      # Sidebar do customer portal
│   │   │   ├── AdminSidebar.tsx          # Sidebar do admin panel
│   │   │   ├── UserMenu.tsx              # 'use client' — dropdown com logout
│   │   │   └── MobileNav.tsx             # 'use client' — nav mobile
│   │   └── shared/
│   │       ├── ActionButton.tsx          # 'use client' — form genérico p/ Server Actions (seção 5.2.2)
│   │       ├── ErrorBoundary.tsx         # 'use client' — captura erros em Client trees
│   │       ├── LoadingSpinner.tsx        # Skeleton/spinner compartilhado
│   │       ├── StatusBadge.tsx           # Badge com cores por status
│   │       └── EmptyState.tsx            # Estado vazio padronizado
│   │
│   ├── lib/                              # Utilitários e infraestrutura
│   │   ├── services/                     # HTTP CLIENT — ÚNICA fonte de fetch
│   │   │   ├── http-client.ts            # voxaFetch<T>() — a única função que faz fetch
│   │   │   ├── errors.ts                 # VoxaApiError, isVoxaApiError(), errorMessages
│   │   │   └── response.ts               # parseApiResponse(), parsePaginatedResponse()
│   │   ├── auth/
│   │   │   ├── tokens.ts                 # getAccessToken(), setAccessToken(), clearTokens()
│   │   │   └── guards.ts                 # isAuthenticated(), isAdmin() — type guards
│   │   ├── env.ts                        # Zod validation de process.env (falha no boot se inválido)
│   │   └── utils.ts                      # cn(), formatDate(), formatDuration(), etc.
│   │
│   ├── middleware.ts                      # Proteção de rotas — roda na edge
│   │
│   └── test/
│       ├── setup.ts                      # Vitest: @testing-library/jest-dom, global mocks
│       ├── mocks/
│       │   ├── server.ts                 # MSW server setup (Node.js)
│       │   └── handlers/
│       │       ├── auth.handlers.ts      # Mock de /auth/*
│       │       ├── keys.handlers.ts      # Mock de /keys/*
│       │       └── ...
│       └── helpers/
│           ├── render.tsx                # renderWithProviders() — wraps AuthContext
│           └── fixtures.ts               # Factories de dados de teste
│
├── .env.example                          # Template de variáveis (sem valores reais)
├── .env.local                            # Local (git ignored)
├── biome.json                            # Config do Biome
├── vitest.config.ts                      # Config do Vitest
├── tsconfig.json                         # TypeScript strict config
├── tailwind.config.ts                    # Tailwind + shadcn/ui
├── components.json                       # Config shadcn/ui
├── next.config.ts                        # Next.js config (desabilita ESLint, usa Biome)
└── package.json
```

---

## Seção 5 — Padrões de Código

> **Atenção: esta seção foi reescrita com exemplos extraídos do código real implementado.**
> Qualquer padrão aqui é prescritivo. PRs que desviem serão recusados.

---

### 5.1 — Server Components vs Client Components

**Regra:** Server Component é o padrão. Adicione `'use client'` SOMENTE se o componente precisar de `useState`, `useEffect`, `usePathname`, `useActionState` ou handlers de evento interativos.

#### ✅ Server Component — sem diretiva, async, busca dados diretamente

```tsx
// src/app/dashboard/api-keys/page.tsx — Server Component real do codebase
import { ApiKeyTable } from '@/domains/api-keys/components/ApiKeyTable';
import { CreateApiKeyDialog } from '@/domains/api-keys/components/CreateApiKeyDialog';
import { listApiKeys } from '@/domains/api-keys/service';

export const dynamic = 'force-dynamic';

export default async function ApiKeysPage() {
  // Chamada direta ao service — sem fetch no componente, sem useEffect
  const keys = await listApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
        <CreateApiKeyDialog /> {/* Client Component embutido num Server Component — ok */}
      </div>
      <ApiKeyTable keys={keys} /> {/* Server Component que renderiza a tabela */}
    </div>
  );
}
```

```tsx
// src/components/layout/DashboardSidebar.tsx — sidebar sem 'use client'
// Não precisa de interatividade: apenas renderiza links
import { DashboardNavButton } from './DashboardNavButton';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exactMatch: true },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  // ...
];

export function DashboardSidebar() {
  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      {navItems.map((item) => (
        <DashboardNavButton key={item.href} {...item} />
      ))}
    </aside>
  );
}
```

#### ✅ Client Component — com `'use client'`, precisa de hook do browser

```tsx
// src/components/layout/DashboardNavButton.tsx — tem 'use client' por causa do usePathname
'use client';
import { usePathname } from 'next/navigation';

export function DashboardNavButton({ href, label, icon: Icon, exactMatch }: Props) {
  const pathname = usePathname();
  const isActive = exactMatch ? pathname === href : pathname.startsWith(href);
  // ... renderiza link com estilo ativo/inativo
}
```

#### ❌ Errado — Client Component desnecessário

```tsx
'use client'; // ← REMOVA se o componente não usa hooks nem eventos
export function ProfileHeader({ name }: { name: string }) {
  return <h1>{name}</h1>; // poderia e deve ser Server Component
}
```

#### Referência rápida

| É Server Component | É Client Component (`'use client'`) |
|---|---|
| `app/dashboard/*/page.tsx` | `CreateApiKeyDialog.tsx` — `useState`, `useActionState` |
| `app/dashboard/layout.tsx` | `RevokeApiKeyButton.tsx` — `useActionState`, `useRef` |
| `DashboardSidebar.tsx` | `DashboardNavButton.tsx` — `usePathname` |
| `AdminSidebar.tsx` | `ProfileForm.tsx` — `useActionState` |
| `ApiKeyTable.tsx` | `LoginForm.tsx` — `useActionState` |
| `ProfileHeader.tsx` | `ActionButton.tsx` — `useActionState` |

---

### 5.2 — Service Layer (`service.ts`)

**Regra:** Todo `fetch` à Voxa API passa pelo HTTP client centralizado. Services são a única camada que chama `voxaGet`, `voxaPost`, `voxaPatch`, `voxaDelete`.

#### Estrutura obrigatória

```typescript
// src/domains/api-keys/service.ts — exemplo real
import 'server-only'; // ← OBRIGATÓRIO. Garante que este módulo nunca vai para o cliente.
import { voxaDelete, voxaGet, voxaPost } from '@/lib/services';
import type { ApiKey, CreateApiKeyResponse } from './schemas';
import {
  ApiKeyListResponseSchema,
  CreateApiKeyResponseSchema,
  DeleteApiKeyResponseSchema,
} from './schemas';

export async function listApiKeys(): Promise<ApiKey[]> {
  const result = await voxaGet('/api/v1/keys', ApiKeyListResponseSchema);
  return result.data;
}

export async function createApiKey(label: string): Promise<CreateApiKeyResponse> {
  const result = await voxaPost('/api/v1/keys', { label }, CreateApiKeyResponseSchema);
  return result.data;
}

export async function revokeApiKey(id: string): Promise<void> {
  await voxaDelete(`/api/v1/keys/${id}`, DeleteApiKeyResponseSchema);
}
```

#### Helpers disponíveis em `@/lib/services`

```typescript
// src/lib/services/http-client.ts — assinaturas dos helpers

// GET — lê token do cookie, valida resposta com schema Zod
voxaGet<T>(endpoint: string, schema: ZodSchema<T>, tags?: string[]): Promise<T>

// POST — envia body JSON
voxaPost<T>(endpoint: string, body: unknown, schema: ZodSchema<T>): Promise<T>

// PUT — substitui recurso
voxaPut<T>(endpoint: string, body: unknown, schema: ZodSchema<T>): Promise<T>

// PATCH — atualização parcial
voxaPatch<T>(endpoint: string, body: unknown, schema: ZodSchema<T>): Promise<T>

// DELETE — remove recurso
voxaDelete<T>(endpoint: string, schema: ZodSchema<T>): Promise<T>
```

#### Erros retornados pelos services

Services não retornam erros — lançam exceções tipadas:

```typescript
// src/lib/services/errors.ts
VoxaApiError     // Erro da API (4xx, 5xx). Tem .message, .code, .statusCode, .details
VoxaNetworkError // Falha de conexão (ECONNREFUSED, timeout, etc.)

// Type guards para uso em actions.ts:
isVoxaApiError(err)     // true se for VoxaApiError
isVoxaNetworkError(err) // true se for VoxaNetworkError
```

#### Caso especial: `fetch` direto — auth diferente ou multipart

Quando a chamada usa autenticação **diferente da sessão** (ex: API Key do próprio usuário) ou **multipart FormData** (que o voxaFetch não suporta), `fetch` direto é permitido — mas **somente dentro de `actions.ts`**:

```typescript
// src/domains/transcriptions/actions.ts — fetch direto (caso especial real)
// Por quê: auth é Bearer com a API Key do usuário (não cookie de sessão),
// e o body é multipart (FormData) — voxaFetch envia apenas JSON.
export async function transcribeAudioAction(formData: FormData): Promise<TranscribeResult> {
  await requireAuth();
  const audioFile = formData.get('audio');
  const apiKey = formData.get('apiKey');
  // ...validação...

  const apiFormData = new FormData();
  apiFormData.append('audio', audioFile as File);

  const response = await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}/api/v1/transcribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` }, // API Key do usuário, não sessão
    body: apiFormData, // multipart — não JSON
  });
  // ...parse manual da resposta...
}
```

#### Regras absolutas

| ✅ Permitido | ❌ Proibido |
|---|---|
| `voxaGet/Post/Patch/Delete` em `service.ts` | `fetch()` em qualquer `service.ts` |
| `fetch` direto em `actions.ts` quando auth/body são diferentes | `fetch()` em componentes |
| Service lança `VoxaApiError`/`VoxaNetworkError` | `fetch()` direto em `page.tsx` ou `layout.tsx` |

---

### 5.3 — Server Actions (`actions.ts`)

**Regra:** Actions validam input com Zod, delegam ao service, e retornam resultado tipado. Sem lógica de negócio, sem `fetch` (exceto caso especial documentado em 5.2).

#### Assinatura correta

```typescript
// src/domains/api-keys/actions.ts — padrão real
'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth/require-auth';
import { isVoxaApiError } from '@/lib/services';
import { CreateApiKeyInputSchema } from './schemas';
import { createApiKey } from './service';

// Tipo de retorno explícito — facilita inferência no cliente
type CreateApiKeyResult =
  | { success: true; rawToken: string; key: ApiKey }
  | { success: false; error: string };

// ✅ Assinatura: apenas formData — SEM _prevState na server action
export async function createApiKeyAction(formData: FormData): Promise<CreateApiKeyResult> {
  await requireAuth(); // redireciona para /login se não autenticado

  const parsed = CreateApiKeyInputSchema.safeParse({
    label: formData.get('label'),
  });

  if (!parsed.success) {
    const errorMsg = parsed.error.flatten().fieldErrors.label?.[0] ?? 'Dados inválidos.';
    return { success: false, error: errorMsg };
  }

  try {
    const result = await createApiKey(parsed.data.label);
    revalidatePath('/dashboard/api-keys'); // invalida cache após mutação
    return { success: true, rawToken: result.rawToken, key: { ...result } };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Erro inesperado. Tente novamente.' };
  }
}
```

#### Onde fica o `_prevState`?

O `_prevState` **não existe na server action**. Ele é parte do wrapper no `useActionState` do cliente:

```typescript
// ✅ CORRETO — _prevState fica no wrapper cliente
const [state, action, isPending] = useActionState(
  async (_prevState: CreateState, formData: FormData): Promise<CreateState> => {
    const result = await createApiKeyAction(formData); // action recebe só formData
    return result.success ? { success: true, rawToken: result.rawToken } : result;
  },
  null,
);

// ❌ ERRADO — nunca adicionar _prevState na server action
export async function createApiKeyAction(
  _prevState: CreateApiKeyResult | null, // ← REMOVER
  formData: FormData,
): Promise<CreateApiKeyResult> { ... }
```

#### Tipos de retorno padronizados

Para actions sem dados de retorno (ex: revogar, logout):
```typescript
type RevokeApiKeyResult = { success: true } | { success: false; error: string };
```

Para actions com dados de retorno:
```typescript
type CreateApiKeyResult =
  | { success: true; rawToken: string; key: ApiKey }
  | { success: false; error: string };
```

Para actions com field-level errors (formulários com múltiplos campos):
```typescript
// Via src/lib/actions.ts
type UpdateProfileState =
  | { success: true; data: UserProfile }
  | { success: false; error: Record<string, string[]>; fields?: Record<string, string> }
  | null;
```

#### Regras absolutas

| ✅ Obrigatório | ❌ Proibido |
|---|---|
| `'use server'` no topo do arquivo | `fetch()` direto (exceto caso especial de 5.2) |
| `await requireAuth()` em toda action protegida | Lógica de negócio (cálculos, transformações) |
| `safeParse` → retornar erro de validação | `throw` de erro sem capturar |
| Chamar service correspondente | Formatar ou transformar resposta da API |
| `revalidatePath()` após mutação bem-sucedida | `_prevState` na assinatura da action |
| Capturar `isVoxaApiError` / genérico | `as Type` em dados da API |

---

### 5.4 — Formulários e Dialogs (`'use client'`)

**Regra:** Todos os formulários usam `useActionState` + `<form action={action}>`. Nenhum `onSubmit + e.preventDefault()`. Nenhum `useState` para campos.

#### Padrão canônico — formulário simples

```tsx
// src/domains/auth/components/LoginForm.tsx — exemplo real
'use client';

import { useActionState } from 'react';
import { toast } from 'sonner';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { loginAction } from '../actions';

export function LoginForm() {
  const [state, action, isPending] = useActionState(
    async (_prevState: FieldActionResult | null, formData: FormData) => {
      const result = await loginAction(formData);

      // ✅ Efeitos colaterais AQUI, dentro do wrapper — nunca em useEffect
      if (!result.success && result.error._form) {
        toast.error(result.error._form[0]);
      }

      return result;
    },
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        name="email"
        label="Email"
        type="email"
        // defaultValue preserva valor digitado sem useState
        defaultValue={state?.success === false ? (state.fields?.email ?? '') : ''}
        errors={state?.success === false ? state.error : null}
      />
      <FormField
        name="password"
        label="Senha"
        type="password"
        errors={state?.success === false ? state.error : null}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
```

#### Padrão com dialog — useActionState controla estado do modal

```tsx
// src/domains/api-keys/components/CreateApiKeyDialog.tsx — exemplo real
'use client';

import { useActionState, useState } from 'react';

type CreateState = null | { success: true; rawToken: string } | { success: false; error: string };

export function CreateApiKeyDialog() {
  const [open, setOpen] = useState(false); // useState só para abrir/fechar dialog

  const [state, action, isPending] = useActionState(
    async (_prevState: CreateState, formData: FormData): Promise<CreateState> => {
      const result = await createApiKeyAction(formData);
      // sem toast aqui — o dialog muda de step automaticamente via state.success
      return result.success ? { success: true, rawToken: result.rawToken } : result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {state?.success ? (
        <RawTokenRevealStep rawToken={state.rawToken} onClose={() => setOpen(false)} />
      ) : (
        <form action={action}> {/* ← <form action={action}>, não onSubmit */}
          <Input name="label" required />
          {state?.success === false && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Criando...' : 'Criar API Key'}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
```

#### ActionButton — para ações de 1 clique sem campos visíveis

```tsx
// src/components/shared/ActionButton.tsx — implementação real
'use client';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';

type ActionFn = (formData: FormData) => Promise<unknown>;

export function ActionButton({ action, data = {}, children, disabled, ...buttonProps }) {
  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => await action(formData),
    null,
  );

  return (
    <form action={formAction}>
      {Object.entries(data).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <Button type="submit" disabled={isPending || disabled} {...buttonProps}>
        {children ?? 'Confirmar'}
      </Button>
    </form>
  );
}

// Uso real — sem form manual, sem estado local:
<ActionButton action={revokeApiKeyAction} data={{ id: key.id }} variant="destructive">
  Revogar
</ActionButton>
```

#### `FormField` — componente compartilhado para inputs com label e erros

```tsx
// src/components/shared/FormField.tsx — Server Component (sem 'use client')
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  errors?: Record<string, string[]> | null;
}

export function FormField({ name, label, errors, ...inputProps }: FormFieldProps) {
  const fieldErrors = errors?.[name];
  return (
    <div className="space-y-1">
      <Label htmlFor={`field-${name}`}>{label}</Label>
      <Input id={`field-${name}`} name={name} aria-invalid={!!fieldErrors} {...inputProps} />
      {fieldErrors && <p className="text-sm text-destructive">{fieldErrors[0]}</p>}
    </div>
  );
}
```

#### Quando usar cada padrão

| Situação | Padrão |
|---|---|
| Form com campos visíveis (label, email, etc.) | `useActionState` + `<form action={action}>` |
| Dialog com form interno | `useActionState` + `<form action={action}>` dentro do dialog |
| Ação de 1 clique (revogar, suspender, ativar) | `<ActionButton action={fn} data={{ id }}>` |
| Toast/redirect após action | Dentro do wrapper do `useActionState` — nunca em `useEffect` |

#### Regras absolutas

| ✅ Obrigatório | ❌ Proibido |
|---|---|
| `useActionState` + `<form action={action}>` | `onSubmit + e.preventDefault()` |
| `defaultValue` com `state.fields` para preservar input | `useState` para valor de campo de formulário |
| Toast/redirect no wrapper do `useActionState` | `useEffect` para reagir a resultado de action |
| `FormField` para inputs com label e erros | Campo de formulário sem acessibilidade (sem `id`/`htmlFor`) |

---

### 5.5 — Schemas Zod (`schemas.ts`)

**Regra:** Schema Zod é a fonte de verdade. Tipos TypeScript são derivados com `z.infer<>`. Sem interfaces manuais para entidades que já têm schema.

#### Estrutura padrão de um arquivo `schemas.ts`

```typescript
// src/domains/api-keys/schemas.ts — exemplo real
import { z } from 'zod';

// ─── 1. Schema da entidade (o que a API retorna) ──────────────────────────────
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  isRevoked: z.boolean(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

// ─── 2. Schemas de input (validação de forms) ─────────────────────────────────
export const CreateApiKeyInputSchema = z.object({
  label: z.string().min(1, 'Label obrigatório').max(100, 'Máximo 100 caracteres'),
});

// ─── 3. Schemas de resposta da API (envelope data:) ───────────────────────────
export const ApiKeyListResponseSchema = z.object({
  data: z.array(ApiKeySchema),
});

export const CreateApiKeyResponseSchema = z.object({
  data: ApiKeySchema.extend({
    rawToken: z.string(), // incluso apenas na criação
  }),
});

// Schema para DELETE que pode retornar {} ou { message: "ok" }
export const DeleteApiKeyResponseSchema = z.object({}).passthrough();

// ─── 4. Tipos derivados (NUNCA interface manual) ──────────────────────────────
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>['data'];
```

#### Enums — usar `z.enum()` no schema, nunca `enum` TypeScript

```typescript
// src/domains/subscriptions/schemas.ts — enums reais do codebase
export const TierSchema = z.enum(['trial', 'basic', 'pro']);
export const SubscriptionStatusSchema = z.enum(['active', 'trial', 'suspended', 'cancelled']);
export const TranscriptionStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

// Tipo derivado do enum Zod:
export type Tier = z.infer<typeof TierSchema>;
// → type Tier = 'trial' | 'basic' | 'pro'

// ❌ Nunca:
enum Tier { trial = 'trial', basic = 'basic', pro = 'pro' } // TypeScript enum — proibido
```

#### Constantes e labels — objeto `as const` em `constants.ts`

Para labels de UI e mapeamentos, use objetos `as const` (não Zod — são constantes, não validação):

```typescript
// src/domains/subscriptions/constants.ts — padrão real
import type { Tier, SubscriptionStatus } from './schemas';

export const TIER_LABELS: Record<Tier, string> = {
  trial: 'Trial',
  basic: 'Basic',
  pro: 'Pro',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'Trial',
  active: 'Ativa',
  suspended: 'Suspensa',
  cancelled: 'Cancelada',
};

export const TIER_RATE_LIMITS: Record<Tier, number> = {
  trial: 20,
  basic: 60,
  pro: 300,
};
```

#### Regras absolutas

| ✅ Obrigatório | ❌ Proibido |
|---|---|
| `z.enum([...])` para valores limitados validados pela API | `enum` TypeScript keyword |
| `z.infer<typeof XyzSchema>` para tipos derivados | Interface TypeScript separada para entidade que tem schema |
| Schema de resposta com envelope `data:` | `as Type` ou `as unknown as Type` |
| `safeParse` em actions (retorna `{ success, error }`) | `parse()` com try/catch para validação de input |

---

### 5.6 — Componentes de Layout (Sidebar/Nav)

**Regra:** Sidebars são Server Components. NavButtons têm `'use client'` por causa do `usePathname`. O layout (Server Component) faz o gate de auth antes de renderizar a sidebar.

#### DashboardSidebar — Server Component puro

```tsx
// src/components/layout/DashboardSidebar.tsx — sem 'use client'
import { DashboardNavButton } from './DashboardNavButton';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, exactMatch: true },
  { href: '/dashboard/quickstart', label: 'Quickstart', icon: Zap },
  { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
  // ...
];

export function DashboardSidebar() {
  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col">
      <nav className="flex-1 p-2 flex flex-col gap-1">
        {navItems.map((item) => (
          <DashboardNavButton key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  );
}
```

#### DashboardNavButton — Client Component (apenas por causa do `usePathname`)

```tsx
// src/components/layout/DashboardNavButton.tsx
'use client'; // necessário apenas para usePathname — estado ativo do link

import { usePathname } from 'next/navigation';

export function DashboardNavButton({ href, label, icon: Icon, exactMatch }: Props) {
  const pathname = usePathname();
  const isActive = exactMatch ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <Link
      href={href}
      className={cn(isActive ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground')}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}
```

#### Auth gate no layout — Server Component com `requireAuth`/`requireAdmin`

```tsx
// src/app/dashboard/layout.tsx — Server Component com gate de auth
import 'server-only'; // garante que nunca vai para o cliente
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { requireAuth } from '@/lib/auth/require-auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAuth(); // redireciona para /login se não autenticado

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}

// src/app/admin/layout.tsx — mesma estrutura com requireAdmin
export default async function AdminLayout({ children }) {
  await requireAdmin(); // redireciona para /login ou /dashboard se não admin
  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
```

#### `userRole` — não é prop, é lido do cookie pelo middleware e layouts

O `userRole` não é passado como prop para a sidebar. O middleware (`middleware.ts`) lê o cookie `userRole` para decisões de redirect. O layout chama `requireAuth()`/`requireAdmin()` como segunda camada de proteção server-side. A sidebar exibe itens fixos — não tem lógica condicional por role.

---

### 5.7 — Checklist obrigatório antes de qualquer commit

Execute todos os comandos abaixo. Zero erros/warnings em qualquer um:

```bash
cd /home/clawdbot/.openclaw/workspace/coding/voxa-dashboard

# 1. Lint (Biome) — zero erros e warnings
npm run lint

# 2. Type check — zero erros TypeScript
npm run type-check

# 3. Build de produção — deve completar sem erros
npm run build

# 4. Testes — todos devem passar
npm run test:run
```

Scripts disponíveis (`package.json`):

```bash
npm run dev          # next dev --port 3001
npm run build        # next build
npm run start        # next start --port 3001
npm run lint         # biome check .
npm run lint:fix     # biome check --write .
npm run format       # biome format --write .
npm run format:check # biome format --check .
npm run type-check   # tsc --noEmit
npm run test         # vitest (modo watch)
npm run test:run     # vitest run (CI, sem watch)
npm run test:coverage # vitest run --coverage
```

---

## Seção 6 — Sprint Plan

> Baseado na análise de dependências das 12 issues.
> Projeto médio → 3 sprints validado.

### Sprint 1 — Fundação (Sequential)
> Duração estimada: 1 semana | Todas as issues são dependências críticas das demais

| Issue | Título | Modo | Estimativa | Dependências |
|-------|--------|------|-----------|-------------|
| #1 | SETUP: Next.js, Biome, Zod, shadcn/ui, Vitest, estrutura DDD | Sequential | 2 dias | — |
| #11 | Camada de serviços: HTTP client + Zod + retry automático | Sequential | 2 dias | #1 |
| #2 | AUTH: login, registro, refresh token, middleware de proteção | Sequential | 3 dias | #1 |

**Paralelismo no Sprint 1:**
- **Fase 1A:** #1 SETUP (bloqueante — deve ser feito primeiro, sozinho)
- **Fase 1B:** #11 e #2 podem começar em paralelo após #1 ✅ (mas #2 depende do HTTP client para chamadas de auth — recomenda-se #11 antes)

**Ordem recomendada:** `#1 → #11 → #2`

**Entregável:** Projeto rodando localmente, auth funcionando, HTTP client testado com mocks.

---

### Sprint 2 — Customer Features (Parallel)
> Duração estimada: 1-1.5 semanas | Todas as issues são independentes entre si

| Issue | Título | Modo | Estimativa | Dependências |
|-------|--------|------|-----------|-------------|
| #3 | Dashboard: overview com métricas e trial countdown | Parallel | 2 dias | #1, #2, #11 |
| #4 | API Keys: listar, criar (rawToken 1x), revogar | Parallel | 3 dias | #1, #2, #11 |
| #5 | Transcrições: lista paginada, filtros, detalhe | Parallel | 2 dias | #1, #2, #11 |
| #6 | Perfil: visualizar e editar via Server Action + Zod | Parallel | 1 dia | #1, #2, #11 |
| #7 | Assinatura: plano atual, countdown, upgrade | Parallel | 2 dias | #1, #2, #11 |

**Paralelismo no Sprint 2:**
- Todas as 5 features podem ser desenvolvidas em **paralelo total** (devs diferentes, sem conflito)
- Componentes compartilhados (`StatusBadge`, `PaginationControls`) devem ser extraídos antes ou durante a primeira feature que precisar deles
- Issue #4 tem a UX mais crítica (rawToken) — priorizar revisão de código

**Entregável:** Customer Portal completo e funcional.

---

### Sprint 3 — Admin + DevOps (Mixed)
> Duração estimada: 1 semana

| Issue | Título | Modo | Estimativa | Dependências |
|-------|--------|------|-----------|-------------|
| #8 | Admin: lista de clientes com busca, filtros e paginação | Parallel | 2 dias | #1, #2, #11 |
| #10 | Admin: audit logs com filtros na URL | Parallel | 2 dias | #1, #2, #11 |
| #9 | Admin: detalhe do cliente + gestão de assinatura | Sequential | 2 dias | #8 + acima |
| #12 | CI/CD: GitHub Actions lint, type-check, build, testes, fetch check | Parallel | 1 dia | — |

**Paralelismo no Sprint 3:**
- **Fase 3A:** #8, #10, e #12 podem rodar em paralelo
- **Fase 3B:** #9 após conclusão de #8 (navegação lista → detalhe)

**Entregável:** Admin Panel completo, pipeline CI/CD configurado, projeto pronto para produção.

---

### Diagrama de Dependências

```
#1 SETUP ──────────────────────────────────────────────────┐
     │                                                       │
     ▼                                                       │
#11 HTTP Client ──────────────────────────────────────────┐ │
     │                                                     │ │
     ▼                                                     │ │
#2 AUTH ─────────────────────────────────────────────────┐│ │
     │                                                    ││ │
     ├──► #3 Overview (parallel)                         ││ │
     ├──► #4 API Keys (parallel) ◄─────────────────────┘│ │
     ├──► #5 Transcrições (parallel) ◄──────────────────┘ │
     ├──► #6 Perfil (parallel) ◄───────────────────────┘   │
     ├──► #7 Assinatura (parallel) ◄─────────────────────┘
     ├──► #8 Admin Customers ──► #9 Customer Detail
     ├──► #10 Audit Logs (parallel com #8)
     └──► #12 CI/CD (pode ser feito a qualquer momento)
```

---

## Seção 7 — Variáveis de Ambiente

```bash
# .env.example — copie para .env.local e preencha

# ─── Obrigatórias ───────────────────────────────────────────────
# URL base da Voxa API (sem trailing slash)
NEXT_PUBLIC_VOXA_API_URL=http://localhost:3000

# URL pública deste dashboard (usado em redirects e OG tags)
NEXT_PUBLIC_APP_URL=http://localhost:3001

# ─── Opcionais ──────────────────────────────────────────────────
# Ambiente de execução (development | test | production)
NODE_ENV=development
```

### Validação com Zod (src/lib/env.ts)

O arquivo `src/lib/env.ts` valida todas as variáveis no momento do import com Zod.
Se uma variável obrigatória estiver faltando, o processo falha com mensagem clara.

**Nunca usar `process.env.X` diretamente no código.** Sempre importar de `@/lib/env`:

```typescript
// ✅ Correto
import { env } from '@/lib/env';
const url = env.NEXT_PUBLIC_VOXA_API_URL;

// ❌ Errado
const url = process.env.NEXT_PUBLIC_VOXA_API_URL!;
```

---

## Seção 8 — Setup Local

### Pré-requisitos

- Node.js 20+ (recomendado: LTS atual)
- npm 10+
- Voxa API rodando (localmente ou em staging)
- Git + GitHub CLI (`gh`)

### Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/AndreClawdTeam/voxa-dashboard
cd voxa-dashboard

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com:
# NEXT_PUBLIC_VOXA_API_URL=http://localhost:3000  (ou URL da Voxa API)
# NEXT_PUBLIC_APP_URL=http://localhost:3001

# 4. Iniciar o servidor de desenvolvimento
npm run dev
# → http://localhost:3001
```

### Scripts NPM

```bash
# Desenvolvimento
npm run dev          # Next.js dev server em http://localhost:3001

# Build e produção
npm run build        # Build de produção
npm run start        # Servidor de produção (após build) em http://localhost:3001

# Qualidade de código
npm run lint         # biome check . (linting)
npm run lint:fix     # biome check --write . (auto-fix)
npm run format       # biome format --write . (formatting)
npm run format:check # biome format --check . (CI mode)
npm run type-check   # tsc --noEmit (zero erros de tipo)

# Testes
npm run test         # Vitest em modo watch (desenvolvimento)
npm run test:run     # Vitest run once (CI, sem watch)
npm run test:coverage # Coverage report
```

### Configuração do Next.js (next.config.ts)

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Desabilitar ESLint no build — usamos Biome
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Desabilitar TypeScript check no build — rodamos tsc separado no CI
  // typescript: { ignoreBuildErrors: false }, // manter para capturar erros
};

export default nextConfig;
```

### Configuração do Biome (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "coverage"
    ]
  }
}
```

---

## Seção 9 — Testes (TDD)

> **Metodologia:** Red-Green-Refactor. Escreva o teste ANTES do código.
> **Filosofia Testing Library:** teste comportamento visível ao usuário, não detalhes de implementação.

### Estratégia por Camada

| Camada | Tipo de Teste | Ferramenta | O que testar |
|--------|--------------|-----------|-------------|
| `domains/*/schemas.ts` | Unit | Vitest | Validação Zod: casos válidos e inválidos |
| `domains/*/service.ts` | Unit | Vitest + vi.mock | Chamadas ao HTTP client, tratamento de erro |
| `domains/*/actions.ts` | Unit | Vitest + vi.mock | Validação Zod, chamada do service, revalidatePath |
| `domains/*/components/*.tsx` | Component | RTL + Vitest | Renderização, interações do usuário, calls de action |
| `lib/services/http-client.ts` | Unit | Vitest + MSW | Retry 401, parsing Zod, VoxaApiError |
| `middleware.ts` | Unit | Vitest | Redirecionamentos por token/role |

### Setup do Vitest (vitest.config.ts)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/components/ui/**', // shadcn/ui gerado
        'src/app/**',           // pages testadas via component tests
        '**/*.config.*',
        '**/*.d.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Setup Global (src/test/setup.ts)

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// MSW: inicia server antes dos testes, fecha depois
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Mock do next/navigation — obrigatório para componentes que usam useRouter, etc.
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => '/dashboard'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
}));

// Mock do next/cache para Server Actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

### Exemplos de Testes TDD

#### Unit Test — Server Action

```typescript
// src/domains/api-keys/actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApiKeyAction } from './actions';

// Mock do service — não queremos testar HTTP aqui
vi.mock('./service', () => ({
  createApiKey: vi.fn(),
}));

import { createApiKey } from './service';
import { revalidatePath } from 'next/cache';

describe('createApiKeyAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar erro quando label está vazio', async () => {
    const formData = new FormData();
    formData.set('label', '');

    const result = await createApiKeyAction(null, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.label).toContain(
        expect.stringContaining('Label obrigatório')
      );
    }
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it('deve retornar erro quando label excede 100 caracteres', async () => {
    const formData = new FormData();
    formData.set('label', 'a'.repeat(101));

    const result = await createApiKeyAction(null, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.label).toBeDefined();
    }
  });

  it('deve chamar createApiKey e revalidar path no sucesso', async () => {
    const mockResult = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      label: 'Production App',
      rawToken: 'vxa_abc123xyz',
      prefix: 'vxa_abc1',
      createdAt: new Date().toISOString(),
    };

    vi.mocked(createApiKey).mockResolvedValue(mockResult);

    const formData = new FormData();
    formData.set('label', 'Production App');

    const result = await createApiKeyAction(null, formData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rawToken).toBe('vxa_abc123xyz');
    }
    expect(createApiKey).toHaveBeenCalledWith({ label: 'Production App' });
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/api-keys');
  });

  it('deve retornar erro tipado quando API retorna VoxaApiError', async () => {
    vi.mocked(createApiKey).mockRejectedValue(
      new VoxaApiError('Limite de keys atingido', 'KEY_LIMIT_EXCEEDED')
    );

    const formData = new FormData();
    formData.set('label', 'Test Key');

    const result = await createApiKeyAction(null, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error._form).toContain('Limite de keys atingido');
    }
  });
});
```

#### Component Test — Client Component

```typescript
// src/domains/api-keys/components/RawTokenReveal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RawTokenReveal } from './RawTokenReveal';

describe('RawTokenReveal', () => {
  const mockToken = 'vxa_abc123xyz456';
  const mockOnClose = vi.fn();

  it('deve exibir o token e checkbox não marcado inicialmente', () => {
    render(<RawTokenReveal rawToken={mockToken} onClose={mockOnClose} />);

    expect(screen.getByText(mockToken)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /copiei minha key/i })).not.toBeChecked();
    expect(screen.getByRole('button', { name: /fechar/i })).toBeDisabled();
  });

  it('deve habilitar botão fechar quando checkbox marcado', async () => {
    const user = userEvent.setup();
    render(<RawTokenReveal rawToken={mockToken} onClose={mockOnClose} />);

    await user.click(screen.getByRole('checkbox', { name: /copiei minha key/i }));

    expect(screen.getByRole('button', { name: /fechar/i })).not.toBeDisabled();
  });

  it('deve copiar o token para clipboard quando botão copiar é clicado', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<RawTokenReveal rawToken={mockToken} onClose={mockOnClose} />);

    await user.click(screen.getByRole('button', { name: /copiar/i }));

    expect(writeTextMock).toHaveBeenCalledWith(mockToken);
  });
});
```

### Rodar TDD por domínio

```bash
# Watch mode para um domínio específico
npm test -- --watch src/domains/api-keys

# Rodar apenas testes de actions
npm test -- --watch src/domains/api-keys/actions.test.ts

# Coverage de um domínio
npm run test:coverage -- src/domains/api-keys
```

---

## Seção 10 — Decisões Técnicas (ADRs)

### ADR-001: Next.js App Router vs Pages Router

**Contexto:** Escolha do paradigma de roteamento para o projeto.

**Decisão:** App Router (Next.js 15).

**Alternativas consideradas:**
- Pages Router (Next.js anterior)
- Remix
- Vite + React SPA

**Justificativa:** App Router permite Server Components por default (menos JS no cliente), Server Actions para mutações seguras sem endpoints de API, Layouts aninhados com menos re-renders, e é o futuro do Next.js. React 19 features (`useActionState`, `use()`) são nativas. Pages Router é considerado legado pela Vercel.

**Consequências:**
- ✅ Performance superior com RSC
- ✅ Server Actions eliminam camada de API interna
- ⚠️ Curva de aprendizado para equipes acostumadas com Pages Router
- ⚠️ Debugging mais complexo (servidor vs cliente)

---

### ADR-002: Server Actions vs Route Handlers

**Contexto:** Como implementar mutações (POST/PUT/DELETE) sem duplicar a Voxa API.

**Decisão:** Server Actions exclusivamente. Zero endpoints em `app/api/`.

**Alternativas consideradas:**
- Route Handlers (`app/api/[...].ts`)
- Fetch direto do cliente para a Voxa API

**Justificativa:** Server Actions são funções TypeScript que rodam no servidor — sem endpoint público exposto, tipagem end-to-end, integração nativa com forms (`<form action={action}>`), e `useActionState` para estado de loading/error. Route Handlers criariam uma camada de API desnecessária (este dashboard já consome a Voxa API). Fetch direto do cliente exporia o token.

**Consequências:**
- ✅ Zero surface de ataque adicional (sem endpoints públicos)
- ✅ Tipagem TypeScript de ponta a ponta (action → retorno)
- ✅ Progressive enhancement: funciona sem JavaScript
- ⚠️ Server Actions não suportam streaming de resposta (tradeoff aceitável para este caso)

---

### ADR-003: Zod sem Type Assertions

**Contexto:** Estratégia de validação e tipagem de dados da API externa.

**Decisão:** Zod como source of truth para todos os tipos. `z.infer<>` em vez de interfaces manuais. `safeParse()` em vez de `parse()` com try/catch em actions.

**Alternativas consideradas:**
- TypeScript interfaces manuais com type assertions (`as Type`)
- io-ts
- Yup
- Validação manual

**Justificativa:** Zod valida em runtime (a API pode retornar algo inesperado), e os tipos TypeScript são derivados automaticamente — zero duplicação. `safeParse()` retorna um Result type sem exceções. Pesquisa (2025) confirma Zod + Server Actions como padrão da comunidade Next.js.

**Consequências:**
- ✅ Nunca um crash silencioso por dado inesperado da API
- ✅ Tipos sempre sincronizados com a validação
- ⚠️ Overhead de bundle (Zod é ~14kb minzipped) — aceitável

---

### ADR-004: DDD por Domínio vs Organização por Tipo

**Contexto:** Como organizar os arquivos do projeto.

**Decisão:** `src/domains/<domain>/` — todo o código de um domínio junto (schemas, types, service, actions, components).

**Alternativas consideradas:**
- Organização por tipo: `src/components/`, `src/services/`, `src/types/`
- Feature folders: `src/features/<feature>/`

**Justificativa:** DDD por domínio facilita navegação (ao trabalhar em "api-keys", todos os arquivos relevantes estão em um lugar), evita imports circulares entre domínios, facilita extração futura para microfrontends, e alinha com como o time pensa o produto (por domínio de negócio, não por tipo técnico).

**Consequências:**
- ✅ Alta coesão por domínio
- ✅ Fácil de adicionar novos domínios sem tocar código existente
- ⚠️ Componentes verdadeiramente compartilhados ficam em `src/components/shared/`

---

### ADR-005: HTTP Client Centralizado vs Fetch Direto

**Contexto:** Onde e como fazer chamadas para a Voxa API.

**Decisão:** `voxaFetch()` em `src/lib/services/http-client.ts` é a ÚNICA função que chama `fetch()`.

**Alternativas consideradas:**
- Fetch direto nos components/actions
- Axios
- SWR / React Query (para cache client-side)

**Justificativa:** Centralizar o fetch garante que: (1) autenticação Bearer é sempre adicionada, (2) retry no 401 é automático, (3) respostas são sempre validadas com Zod, (4) erros são sempre do tipo `VoxaApiError`. O CI verifica com grep que nenhum `fetch(` existe fora de `lib/services/`. SWR/React Query foram descartados porque este projeto usa Server Components para busca de dados — não precisamos de cache client-side.

**Consequências:**
- ✅ Comportamento consistente em todas as chamadas de API
- ✅ Fácil de adicionar logging, tracing, etc. em um lugar só
- ✅ CI pode verificar automaticamente com grep
- ⚠️ Mais boilerplate inicial — compensado pela segurança e consistência

---

### ADR-006: shadcn/ui vs Outras Bibliotecas

**Contexto:** Biblioteca de componentes de UI.

**Decisão:** shadcn/ui com tema dark.

**Alternativas consideradas:**
- Chakra UI
- Ant Design
- MUI (Material UI)
- Radix UI puro

**Justificativa:** shadcn/ui gera código copiado no projeto (não é uma dependência externa gerenciada) — código é seu, você controla. Componentes são acessíveis (Radix UI por baixo), estilizados com Tailwind (consistência), e suportam Server Components para renderização estática. Chakra/MUI/Ant Design têm bundle maior e impõem mais opiniões de design.

**Consequências:**
- ✅ Acessibilidade garantida pelo Radix UI
- ✅ Sem breaking changes de biblioteca externa (código é seu)
- ✅ Funciona como Server Components (menos JS no cliente)
- ⚠️ Atualizações manuais quando shadcn/ui lança novidades

---

### ADR-007: Biome vs ESLint + Prettier

**Contexto:** Ferramentas de linting e formatação.

**Decisão:** Biome (substitui ESLint + Prettier).

**Alternativas consideradas:**
- ESLint + Prettier
- ESLint apenas
- oxlint + Prettier

**Justificativa:** Biome formata 1k arquivos em ~50ms (Prettier + ESLint leva 1-2s). Único binário, única configuração (`biome.json`). Zero conflitos de regras entre linter e formatter. Pesquisa 2025 mostra adoção crescente — ESLint 9 mudou muito e tornou a migração mais natural para Biome. Economia real em CI time.

**Consequências:**
- ✅ CI muito mais rápido
- ✅ Zero configuração de plugins (tudo num binário)
- ⚠️ Cobertura de regras menor que ESLint (mas crescendo rapidamente)
- ⚠️ Equipe deve instalar extensão Biome no editor (não ESLint)

---

### ADR-008: Cookie HttpOnly vs localStorage para JWT

**Contexto:** Onde armazenar tokens JWT de autenticação.

**Decisão:** `refreshToken` em cookie HttpOnly (Voxa API seta). `accessToken` em memória (AuthContext) + cookie de sessão lido pelo middleware.

**Alternativas consideradas:**
- Tudo em localStorage
- Tudo em sessionStorage
- Apenas cookies

**Justificativa:**
- **localStorage** é vulnerável a XSS — qualquer script malicioso lê o token.
- **Cookie HttpOnly** para refreshToken: JS não pode ler, enviado automaticamente pelo browser. A Voxa API seta via `Set-Cookie`.
- **Memória (AuthContext)** para accessToken: limpo ao fechar aba, não persiste em localStorage.
- **Cookie de sessão** para `userRole` (não sensível): lido pelo middleware Next.js para decisões de roteamento.

**Consequências:**
- ✅ Máxima segurança: XSS não acessa refreshToken
- ✅ CSRF mitigado pelo padrão de Server Actions (POST com CSRF token implícito)
- ⚠️ accessToken perdido ao recarregar página → refresh automático no boot da app

---

### ADR-009: React Context vs Zustand/Jotai para Auth

**Contexto:** Gerenciamento do estado de autenticação no cliente.

**Decisão:** React Context nativo (`createContext` + `useContext`) para auth.

**Alternativas consideradas:**
- Zustand
- Jotai
- Redux Toolkit

**Justificativa:** Estado de auth é simples: `user | null`, `accessToken | null`, `setAuth()`, `clearAuth()`. Context é suficiente. Zustand/Jotai adicionam dependência e complexidade para um caso simples. Regra: não usar gerenciador de estado externo se Context resolve — adicione quando sentir a dor de prop drilling ou re-renders excessivos.

**Importante:** Context só existe em Client Components (`'use client'`). Server Components buscam dados diretamente nos services — não passam por Context.

**Consequências:**
- ✅ Zero dependência adicional
- ✅ Padrão React nativo — qualquer dev React conhece
- ⚠️ Re-renders em toda a árvore ao mudar contexto — mitigado com `useCallback` e splitting de contextos se necessário

---

### ADR-010: Vitest vs Jest

**Contexto:** Test runner para o projeto.

**Decisão:** Vitest.

**Alternativas consideradas:**
- Jest com ts-jest
- Jest com babel-jest

**Justificativa:** Vitest é ESM-native, não precisa de transformação babel. API 100% compatível com Jest (migração fácil se necessário). Integração nativa com Vite/Next.js (alias de paths resolvidos automaticamente). Muito mais rápido que Jest em projetos ESM modernos. Documentação oficial do Next.js recomenda Vitest.

**Consequências:**
- ✅ Zero config para aliases TypeScript (`@/`)
- ✅ HMR nos testes (--watch é muito rápido)
- ✅ `vi.mock` é idêntico ao `jest.mock`
- ⚠️ Alguns plugins Jest não têm equivalente — não é problema para este projeto

---

## Seção 11 — Checklist de Qualidade

> **Obrigatório antes de qualquer PR.** O CI verifica todos esses pontos automaticamente.
> PR não pode ser mergeado com qualquer step falhando.

```bash
cd /home/clawdbot/.openclaw/workspace/coding/voxa-dashboard

echo "🔍 1/4 — Biome Lint..."
npm run lint
echo "✅ Lint: zero erros"

echo "🔷 2/4 — TypeScript..."
npm run type-check
echo "✅ Types: zero erros"

echo "🏗️ 3/4 — Build..."
npm run build
echo "✅ Build: sucesso"

echo "🧪 4/4 — Testes..."
npm run test:run
echo "✅ Testes: todos passando"
```

### Checklist Manual Adicional

Antes de abrir o PR, revisar:

- [ ] Nenhum `console.log` esquecido no código
- [ ] Nenhuma `// TODO` crítica pendente
- [ ] Componentes Client (`'use client'`) têm motivo real para serem Client (hook, evento)
- [ ] Toda resposta da API é validada com Zod (nunca `as Type`)
- [ ] Server Actions retornam `{ success: true, ... }` ou `{ success: false, error: ... }`
- [ ] **Server Actions têm apenas `formData: FormData` na assinatura** — sem `_prevState` (seção 5.3)
- [ ] **Nenhum `useEffect` para reagir a resultado de Server Action** — toasts ficam dentro do wrapper do `useActionState` (seção 5.4)
- [ ] **Ações de 1 clique usam `<ActionButton>`** em vez de form/state manual (seção 5.4)
- [ ] `fetch()` direto só ocorre em `actions.ts` com auth/body diferente (seção 5.2)
- [ ] `enum` TypeScript não foi usado — apenas `z.enum()` (seção 5.5)
- [ ] Issues do GitHub atualizadas antes de fechar
- [ ] Testes cobrem o caminho feliz E os casos de erro

---

## Seção 12 — Glossário do Domínio

| Termo | Definição |
|-------|-----------|
| **Voxa API** | A API backend de transcrição de áudio. Base URL: `NEXT_PUBLIC_VOXA_API_URL`. Source of truth para toda lógica de negócio. |
| **voxa-dashboard** | Este projeto. Camada de UI que consome a Voxa API. |
| **Customer Portal** | Parte do dashboard para usuários finais (devs/empresas). Rotas: `/dashboard/*`. |
| **Admin Panel** | Parte do dashboard para a equipe interna Voxa. Rotas: `/admin/*`. Requer `role: admin`. |
| **API Key** | Chave de autenticação criada pelo customer para usar a Voxa API. Formato: `vxa_...`. |
| **rawToken** | O token completo de uma API key, exibido UMA ÚNICA VEZ no momento da criação. Não é armazenado pelo dashboard — o customer deve copiar. |
| **prefix** | Os primeiros chars de uma API key (ex: `vxa_abc1`), usados para identificação sem expor o token completo. |
| **accessToken** | JWT de curta duração (ex: 15min) usado no header `Authorization: Bearer`. Armazenado em memória (AuthContext). |
| **refreshToken** | JWT de longa duração usado para obter novos accessTokens. Armazenado em cookie HttpOnly (setado pela Voxa API). Não acessível por JavaScript. |
| **trial** | Período de 7 dias após o registro com acesso às funcionalidades do plano basic. |
| **basic** | Plano pago com 60 req/min de rate limit. |
| **pro** | Plano premium com 300 req/min de rate limit. |
| **rate limit** | Número máximo de requisições por minuto permitido pelo plano: trial=20, basic=60, pro=300. |
| **Server Component** | Componente React que roda exclusivamente no servidor. Pode fazer async/await, acessar serviços. Sem useState, sem useEffect. Default no App Router. |
| **Client Component** | Componente React que pode usar hooks, eventos, estado local. Marcado com `'use client'`. Necessário para interatividade. |
| **Server Action** | Função TypeScript marcada com `'use server'` que roda no servidor quando chamada de um Client Component ou form. Substitui Route Handlers para mutações. |
| **voxaFetch** | A única função autorizada a chamar `fetch()`. Gerencia auth Bearer, retry no 401, validação Zod de respostas. |
| **VoxaApiError** | Tipo de erro tipado lançado pelo `voxaFetch()` quando a API retorna um erro. Contém `message`, `code` e `details` opcionais. |
| **DDD** | Domain-Driven Design. Organização do código por domínio de negócio (auth, api-keys, transcriptions) em vez de por tipo técnico (services, components, utils). |
| **shadcn/ui** | Biblioteca de componentes UI copiados para o projeto (não uma dependência npm), baseada em Radix UI + Tailwind CSS. |
| **Biome** | Ferramenta de linting e formatação que substitui ESLint + Prettier. Escrita em Rust, ~10-100x mais rápida. |
| **Zod** | Biblioteca de validação runtime com inferência de tipos TypeScript. Schema = source of truth. |
| **ADR** | Architecture Decision Record. Documentação de decisões técnicas significativas com contexto, alternativas e consequências. |
| **TDD** | Test-Driven Development. Red-Green-Refactor: escrever teste que falha → código mínimo para passar → refatorar. |
| **MSW** | Mock Service Worker. Intercepta fetch em testes de integração para simular a Voxa API sem servidor real. |
| **useActionState** | Hook React 19 para gerenciar estado de Server Actions. Aceita qualquer `async fn`, não apenas Server Actions puras — use isso para envolver a action com efeitos colaterais (toast, redirect) **sem `useEffect`**. Padrão: `const [state, action, isPending] = useActionState(async (prev, formData) => { const result = await myAction(prev, formData); if (result.success) toast.success(...); return result; }, null)`. |
| **ActionButton** | Componente `'use client'` genérico em `src/components/shared/ActionButton.tsx`. Renderiza um `<form>` com `useActionState`, aceita `action` (Server Action) e `data` (Record de inputs hidden). Elimina boilerplate de form + hidden inputs para ações de 1 clique (revogar, suspender, ativar). Ver seção 5.2.2. |
| **revalidatePath** | Função Next.js que invalida o cache de uma rota, forçando re-fetch no próximo acesso. Chamada após mutações bem-sucedidas. |
| **middleware.ts** | Arquivo especial do Next.js que roda na edge (antes do render) para proteção de rotas, redirects, etc. |
| **Audit Log** | Registro imutável de uma ação crítica feita por admin ou sistema (ex: assinatura suspensa, key revogada). |
| **tier** | Nível do plano de assinatura: trial, basic, ou pro. |

---

*Documento gerado por Johnny Juvenil (Tech Lead) — baseado em pesquisa de melhores práticas 2025.*
*Última atualização: Sprint planning inicial — Fev 2026.*
