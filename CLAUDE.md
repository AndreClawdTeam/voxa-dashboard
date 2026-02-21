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
| **Next.js** | 15.x (App Router) | Framework principal; App Router com Server Components, Server Actions e middleware nativo. RSC reduz bundle JS no cliente. |
| **TypeScript** | 5.x strict | `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Zero `any`, zero type assertions. |
| **React** | 19.x | `useActionState`, `useFormStatus`, `use()` hook para Promises. |
| **Zod** | 3.x | Validação runtime + inferência de tipos. Schema = source of truth. Nunca `as Type`. |
| **shadcn/ui** | latest | Componentes acessíveis, copiáveis, tema dark. Baseado em Radix UI + Tailwind CSS. Funciona como Server Components (Card, Table, Badge) e Client (Dialog, Sheet, DropdownMenu). |
| **Tailwind CSS** | 3.x | Utility-first; integrado ao shadcn/ui. |
| **Biome** | 1.x | Linter + formatter em um binário Rust. 10-100x mais rápido que ESLint+Prettier. Zero config duplicada. |
| **Vitest** | 2.x | Test runner ESM-native, API compatível com Jest, integração nativa com Vite/Next.js. |
| **React Testing Library** | latest | Testa comportamento, não implementação. `getByRole`, `userEvent`. |
| **react-hook-form** | 7.x | Gerenciamento de estado de formulários no cliente. Integra com Zod via `@hookform/resolvers`. Usado em forms complexos com validação client-side progressiva. |
| **MSW (Mock Service Worker)** | 2.x | Mocks de API para testes de integração. Intercepta fetch no nível do service worker. |

### Por que não Next.js 16?
O CTO especificou "Next.js 16", mas esta versão não existe ainda (a mais recente estável é Next.js 15.x, com Next.js 14.x em produção). Adotaremos **Next.js 15** (versão atual mais moderna), que inclui todas as features descritas (App Router, Server Actions estáveis, `useActionState`, `next/form`). Atualizaremos para 16 quando lançado — a arquitetura proposta é compatível.

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

> **Decisão de arquitetura:** Server Components por default. Client Components apenas quando necessário.
> Regra de ouro: se não precisa de `useState`, `useEffect`, `onClick` → é Server Component.

### 5.1 Server Components vs Client Components

```tsx
// ✅ Server Component (default) — busca dados diretamente, zero JS no cliente
// src/app/dashboard/api-keys/page.tsx
import { fetchApiKeys } from '@/domains/api-keys/service';
import { ApiKeysTable } from '@/domains/api-keys/components/ApiKeysTable';
import { ApiKeysPageClient } from '@/domains/api-keys/components/ApiKeysPageClient';

export default async function ApiKeysPage() {
  // Sem useState, sem useEffect — roda no servidor
  const keys = await fetchApiKeys();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        {/* Client Component — precisa de estado para o modal */}
        <ApiKeysPageClient />
      </div>
      {/* Server Component — renderiza a tabela sem JS */}
      <ApiKeysTable keys={keys} />
    </div>
  );
}

// ✅ Client Component — APENAS para interatividade
// src/domains/api-keys/components/ApiKeysPageClient.tsx
'use client';
import { useState } from 'react';
import { CreateApiKeyDialog } from './CreateApiKeyDialog';

export function ApiKeysPageClient() {
  const [open, setOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Nova API Key</Button>
      <CreateApiKeyDialog
        open={open}
        onOpenChange={setOpen}
        onKeyCreated={setNewKey}
      />
      {/* RawTokenReveal: exibe token UMA VEZ, depois some */}
    </>
  );
}

// ❌ Errado — Client Component desnecessário
'use client'; // ← remove isso se não usa hooks
export function StaticCard({ title }: { title: string }) {
  return <Card>{title}</Card>; // poderia ser Server Component
}
```

### 5.2 Server Actions

> **Padrão:** Server Actions recebem FormData ou objetos tipados, validam com Zod, chamam service, retornam resultado tipado.
> Não usar Route Handlers (`app/api/`) — Server Actions são mais seguras e eliminam surface de ataque.

```tsx
// src/domains/api-keys/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createApiKey } from './service';
import { CreateApiKeySchema } from './schemas';

// Tipo de retorno explícito — facilita useActionState no cliente
type CreateApiKeyResult =
  | { success: true; data: { rawToken: string; id: string } }
  | { success: false; error: Record<string, string[]> };

export async function createApiKeyAction(
  _prevState: CreateApiKeyResult | null,
  formData: FormData
): Promise<CreateApiKeyResult> {
  const parsed = CreateApiKeySchema.safeParse({
    label: formData.get('label'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await createApiKey(parsed.data);
    revalidatePath('/dashboard/api-keys');
    return { success: true, data: result };
  } catch (err) {
    if (isVoxaApiError(err)) {
      return { success: false, error: { _form: [err.message] } };
    }
    return { success: false, error: { _form: ['Erro inesperado. Tente novamente.'] } };
  }
}

// No Client Component — usar useActionState (React 19)
'use client';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { createApiKeyAction } from '../actions';

export function CreateApiKeyForm() {
  const [state, action, isPending] = useActionState(
    async (prevState: CreateApiKeyResult | null, formData: FormData) => {
      const result = await createApiKeyAction(prevState, formData);
      // ✅ Efeitos colaterais (toast, redirect) aqui — NÃO em useEffect
      if (result.success) {
        toast.success('API key criada com sucesso!');
      } else if (result.error?._form) {
        toast.error(result.error._form[0]);
      }
      return result;
    },
    null,
  );

  return (
    <form action={action}>
      <Input name="label" placeholder="Ex: Production App" />
      {state?.error?.label && (
        <p className="text-destructive text-sm">{state.error.label[0]}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar API Key'}
      </Button>
    </form>
  );
}
```

### 5.2.1 Efeitos pós-action — toast, redirect (sem `useEffect`)

> ❌ **Proibido:** `useEffect` para reagir ao resultado de uma Server Action.
> ✅ **Obrigatório:** Envolver a Server Action em uma função cliente dentro do `useActionState`.

O `useActionState` aceita qualquer função `async` — não apenas Server Actions diretamente. Use isso para **colocar os efeitos colaterais (toast, redirect, analytics) dentro do wrapper**, mantendo a Server Action pura.

```tsx
// ❌ ERRADO — nunca faça isso
const [state, action] = useActionState(revokeApiKeyAction, null);

useEffect(() => {
  if (state?.success) {
    toast.success('Key revogada!'); // useEffect para reagir a state → proibido
  }
}, [state]);

// ✅ CORRETO — efeito dentro do wrapper da action
const [state, action, isPending] = useActionState(
  async (prevState: RevokeApiKeyResult | null, formData: FormData) => {
    const result = await revokeApiKeyAction(prevState, formData); // Server Action
    // Efeitos acontecem aqui, no cliente, após a server action retornar
    if (result.success) {
      toast.success('API key revogada com sucesso.');
    } else {
      toast.error(result.error?._form?.[0] ?? 'Erro ao revogar key.');
    }
    return result;
  },
  null,
);
```

**Por quê?**
- `useEffect` é assíncrono em relação ao render — cria race conditions e duplas execuções em Strict Mode
- O wrapper no `useActionState` é síncrono em relação ao fluxo da action — o toast dispara exatamente quando a action completa, antes do próximo render
- Mantém toda a lógica de "o que fazer após a action" colocada junto à action, não espalhada no componente

---

### 5.2.2 `ActionButton` — componente genérico para Server Actions simples

Para ações que **não precisam de formulário visível** (revogar, suspender, ativar, cancelar), crie um `<form>` com inputs hidden e um botão. Em vez de duplicar esse padrão em cada feature, use o componente genérico `ActionButton`.

```tsx
// src/components/shared/ActionButton.tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

type ActionFn = (
  prevState: unknown,
  formData: FormData,
) => Promise<unknown>;

interface ActionButtonProps extends ComponentProps<typeof Button> {
  /** Server Action a ser chamada no submit */
  action: ActionFn;
  /** Campos a serem enviados como inputs hidden: { chave: valor } */
  data?: Record<string, string>;
  children?: React.ReactNode;
}

export function ActionButton({
  action,
  data = {},
  children,
  disabled,
  ...buttonProps
}: ActionButtonProps) {
  const [, formAction, isPending] = useActionState(action, null);

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
```

**Uso:**

```tsx
// Revogar API Key — sem form manual, sem estado local
<ActionButton
  action={revokeApiKeyAction}
  data={{ id: apiKey.id }}
  variant="destructive"
  size="sm"
>
  Revogar
</ActionButton>

// Admin: suspender cliente
<ActionButton
  action={suspendCustomerAction}
  data={{ userId: customer.id }}
  variant="outline"
>
  Suspender conta
</ActionButton>

// Admin: ativar assinatura
<ActionButton
  action={activateSubscriptionAction}
  data={{ userId: customer.id, tier: 'basic' }}
>
  Ativar plano Basic
</ActionButton>
```

**Quando usar `ActionButton` vs `useActionState` manual:**

| Situação | Padrão |
|---|---|
| Ação com campos visíveis (label, email, etc.) | `useActionState` manual no componente |
| Ação de 1 clique com dados já disponíveis | `ActionButton` com `data={}` |
| Ação que precisa de toast/redirect customizado | Wrapper no `useActionState` (seção 5.2.1) |
| `ActionButton` com toast | Combine: crie wrapper com toast e passe para `ActionButton` |

---

### 5.3 HTTP Client Centralizado

> **Lei:** `fetch()` JAMAIS pode aparecer fora de `src/lib/services/http-client.ts`.
> O CI verifica isso com grep. PRs com fetch direto são bloqueados automaticamente.

```typescript
// src/lib/services/http-client.ts
import { z } from 'zod';
import { env } from '@/lib/env';
import { VoxaApiError } from './errors';
import { parseApiResponse } from './response';
import { getAccessToken, setAccessToken, clearTokens } from '@/lib/auth/tokens';

type VoxaFetchOptions<T> = RequestInit & {
  schema: z.ZodSchema<T>;
};

let isRefreshing = false;

export async function voxaFetch<T>(
  endpoint: string,
  { schema, ...options }: VoxaFetchOptions<T>
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(`${env.NEXT_PUBLIC_VOXA_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  // Retry automático no 401 (token expirado)
  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshResponse = await fetch(
        `${env.NEXT_PUBLIC_VOXA_API_URL}/api/v1/auth/refresh`,
        { method: 'POST', credentials: 'include' }
      );

      if (!refreshResponse.ok) {
        clearTokens();
        throw new VoxaApiError('Sessão expirada. Faça login novamente.', 'UNAUTHORIZED');
      }

      const { data } = await refreshResponse.json();
      setAccessToken(data.accessToken);
      isRefreshing = false;

      // Retry com novo token
      return voxaFetch(endpoint, { schema, ...options });
    } catch {
      isRefreshing = false;
      clearTokens();
      throw new VoxaApiError('Sessão expirada.', 'UNAUTHORIZED');
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new VoxaApiError(
      errorBody.error ?? 'Erro na API',
      errorBody.code ?? 'API_ERROR',
      errorBody.details
    );
  }

  return parseApiResponse(await response.json(), schema);
}
```

### 5.4 Middleware de Proteção de Rotas

> **Abordagem:** Cookie-based auth no middleware (sem next-auth).
> Por quê: A Voxa API gerencia os tokens — não queremos duplicar essa lógica com next-auth.
> O middleware lê cookies `accessToken` e `userRole` para decisões rápidas na edge.

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignora arquivos estáticos e rotas de API internas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Rotas públicas — redireciona para dashboard se já logado
  if (PUBLIC_PATHS.includes(pathname) && accessToken) {
    const redirect = userRole === 'admin' ? '/admin/customers' : '/dashboard';
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  // /dashboard/* — requer autenticação
  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // /admin/* — requer autenticação + role admin
  if (pathname.startsWith('/admin')) {
    if (!accessToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 5.5 Zod — Validação e Tipos (Nunca Type Assertion)

```typescript
// src/domains/api-keys/schemas.ts
import { z } from 'zod';

// Schema = source of truth para tipos e validação
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1).max(100),
  prefix: z.string(),         // "vxa_..." (primeiros chars)
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().nullable(),
  isActive: z.boolean(),
});

export const ApiKeyListSchema = z.array(ApiKeySchema);

export const CreateApiKeySchema = z.object({
  label: z.string().min(1, 'Label obrigatório').max(100, 'Máximo 100 caracteres'),
});

// CRÍTICO: rawToken apenas na criação — não existe em listagens
export const CreateApiKeyResultSchema = z.object({
  id: z.string().uuid(),
  label: z.string(),
  rawToken: z.string(),       // vxa_xxxx — exibir UMA VEZ, não armazenar
  prefix: z.string(),
  createdAt: z.string().datetime(),
});

// Tipos derivados dos schemas — nunca definir interface separada para isso
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
export type CreateApiKeyResult = z.infer<typeof CreateApiKeyResultSchema>;

// ✅ Type guard sem 'as'
export function isApiKey(value: unknown): value is ApiKey {
  return ApiKeySchema.safeParse(value).success;
}

// ❌ NUNCA FAZER ISSO
// const key = response.data as ApiKey;
// const key = response.data as unknown as ApiKey;
```

### 5.6 React Context para Auth

> **Regra:** Context só existe em `'use client'`. Server Components NUNCA acessam Context.
> Server Components buscam dados diretamente nos services.
> Context é para compartilhar estado entre Client Components na árvore.

```tsx
// src/domains/auth/context.tsx
'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
  initialToken = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialToken?: string | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [accessToken, setAccessToken] = useState<string | null>(initialToken);

  const setAuth = useCallback((user: User, token: string) => {
    setUser(user);
    setAccessToken(token);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);

  return (
    <AuthContext.Provider value={{ user, accessToken, setAuth, clearAuth, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook tipado — lança erro se usado fora do Provider
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return context;
}
```

### 5.7 Validação de Env com Zod

> Falha no boot se variável obrigatória estiver ausente. Zero `process.env.X!` espalhado.

```typescript
// src/lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_VOXA_API_URL: z
    .string()
    .url('NEXT_PUBLIC_VOXA_API_URL deve ser uma URL válida'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL deve ser uma URL válida'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

// Valida no momento do import — falha com mensagem clara
const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_VOXA_API_URL: process.env.NEXT_PUBLIC_VOXA_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida. Verifique .env.local');
}

export const env = parsed.data;
```

### 5.8 Padrões de Componentes shadcn/ui

```tsx
// ✅ shadcn/ui funciona como Server Component para renderização
// src/domains/usage/components/UsageOverviewCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUsage } from '../service';

export async function UsageOverviewCards() {
  const usage = await fetchUsage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Transcrições este mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{usage.transcriptionsThisMonth}</p>
        </CardContent>
      </Card>
      {/* ... */}
    </div>
  );
}

// ✅ Client Components para interatividade com shadcn
// src/domains/api-keys/components/RevokeKeyButton.tsx
'use client';
import { useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { revokeApiKeyAction } from '../actions';

export function RevokeKeyButton({ keyId, label }: { keyId: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      await revokeApiKeyAction(keyId);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">Revogar</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar "{label}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível. Aplicações usando esta key deixarão de funcionar imediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleRevoke} disabled={isPending}>
            {isPending ? 'Revogando...' : 'Revogar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
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
npm run build        # Build de produção (verifica tipos, otimiza)
npm start            # Servidor de produção (após build)

# Qualidade de código
npm run lint         # biome check . (linting)
npm run format       # biome format --write . (formatting)
npm run lint:check   # biome check . --diagnostic-level=error (CI mode)
npm run type-check   # tsc --noEmit (zero erros de tipo)

# Testes
npm test             # Vitest em modo watch (desenvolvimento)
npm run test:run     # Vitest run once (CI, sem watch)
npm run test:ui      # Vitest com UI interativa
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
#!/bin/bash
# scripts/pr-check.sh — execute antes de abrir PR

set -e  # Para se qualquer comando falhar

echo "🔍 1/6 — Biome Lint..."
npx biome check .
echo "✅ Lint: zero erros"

echo "🎨 2/6 — Biome Format..."
npx biome format --check .
echo "✅ Format: zero diffs"

echo "🔷 3/6 — TypeScript..."
npx tsc --noEmit
echo "✅ Types: zero erros"

echo "🏗️ 4/6 — Build..."
npm run build
echo "✅ Build: sucesso"

echo "🧪 5/6 — Testes..."
npm run test:run
echo "✅ Testes: todos passando"

echo "🔎 6/6 — Verificando fetch direto fora de lib/services/..."
DIRECT_FETCH=$(grep -r "fetch(" src \
  --include="*.ts" \
  --include="*.tsx" \
  | grep -v "src/lib/services/" \
  | grep -v "\.test\." \
  | grep -v "\.spec\." \
  | grep -v "node_modules" \
  || true)

if [ -n "$DIRECT_FETCH" ]; then
  echo "❌ ERRO: fetch() direto encontrado fora de lib/services/:"
  echo "$DIRECT_FETCH"
  exit 1
fi
echo "✅ Zero fetch direto fora de lib/services/"

echo ""
echo "🚀 Todos os checks passaram! PR pronto para abrir."
```

### Checklist Manual Adicional

Antes de abrir o PR, revisar:

- [ ] Nenhum `console.log` esquecido no código
- [ ] Nenhuma `// TODO` crítica pendente
- [ ] Componentes Client (`'use client'`) têm os mínimos de interatividade justificando o uso
- [ ] Toda resposta da API é validada com Zod (nunca `as Type`)
- [ ] Server Actions retornam `{ success: true, data }` ou `{ success: false, error }`
- [ ] **Nenhum `useEffect` para reagir a resultado de Server Action** — toasts e redirects ficam dentro do wrapper do `useActionState` (seção 5.2.1)
- [ ] **Ações de 1 clique usam `<ActionButton>`** em vez de form/state manual (seção 5.2.2)
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
