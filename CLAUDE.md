# voxa-dashboard

> **Leia este documento antes de escrever qualquer linha de código.**

---

## Visão do Produto

O **voxa-dashboard** é o portal web de autoatendimento da Voxa API — uma API de transcrição de áudio com planos de assinatura (trial, basic, pro).

**Problema que resolve:**
- Clientes (devs e empresas) precisam gerenciar suas integrações com a Voxa API sem depender do suporte: criar/revogar API keys, acompanhar uso mensal, visualizar transcrições realizadas e gerenciar sua assinatura.
- A equipe Voxa (admins) precisa de uma ferramenta para auditar clientes, gerenciar assinaturas e investigar problemas operacionais.

**O que é:**
Dashboard web com dois portais distintos — Customer Portal e Admin Panel — consumindo a Voxa API como única fonte de verdade.

**O que não é:**
Não é um produto separado. É a camada de UI sobre a Voxa API. Toda lógica de negócio vive na API.

---

## Usuários e Personas

### 🧑‍💻 Customer — Desenvolvedor / Empresa que usa a Voxa API

- Criou uma conta na Voxa API e tem um trial de 7 dias
- Precisa integrar a API no seu produto: cria API keys, testa, monitora uso
- Acompanha se está dentro do rate limit (20/60/300 req/min conforme plano)
- Quer visualizar histórico de transcrições para debugging e auditoria interna
- Gerencia upgrade de plano quando o trial expira ou o básico não é mais suficiente

**Comportamento típico:** acessa o dashboard 2-3x/semana para verificar métricas, resolver problemas com keys e baixar histórico.

### 🛡️ Admin — Equipe interna Voxa

- Tem `role: admin` na API
- Investiga problemas de clientes: verifica assinatura, keys, histórico de ações
- Gerencia assinaturas: ativa, suspende, cancela, faz upgrade por demanda (ex: migração de plano manual)
- Audita ações críticas via audit logs para compliance e segurança
- Nunca vê o `rawToken` das API keys dos clientes (a API nunca o expõe após criação)

**Comportamento típico:** acessa o painel admin diariamente para triagem de suporte e verificação de anomalias.

---

## Features por Persona

### Customer Dashboard

| Feature | Descrição | Por que importa |
|---|---|---|
| **Overview de uso** | Transcrições do mês, minutos processados, rate limit atual, status da assinatura | First thing a user sees — deve responder "tudo bem?" em segundos |
| **Trial countdown** | Dias restantes com urgência visual progressiva (verde → amarelo → vermelho) | Conversão: usuários que veem o trial acabar com contexto têm maior taxa de upgrade |
| **Gerenciamento de API Keys** | Listar keys ativas, criar nova (rawToken exibido UMA VEZ), revogar | Core da integração — flow crítico sem margem para erro de UX |
| **Histórico de transcrições** | Lista paginada com filtros, visualização do texto transcrito completo | Debugging e auditoria própria do cliente |
| **Perfil** | Ver e editar nome/email | Self-service básico, reduz tickets de suporte |
| **Assinatura** | Plano atual, período, countdown, botão de upgrade | Conversão e retenção |

### Admin Panel

| Feature | Descrição | Por que importa |
|---|---|---|
| **Lista de clientes** | Busca por nome/email, filtros, status | Triagem rápida de suporte |
| **Detalhe do cliente** | Perfil, assinatura atual, gestão (ativar/suspender/cancelar/upgrade) | Ferramenta central de suporte |
| **Audit Logs** | Histórico imutável de ações com filtros por ação, data, recurso, ator | Compliance, debugging de incidentes, segurança |

---

## Non-Goals — Fora do Escopo v1

- ❌ **Billing / pagamento real** — sem integração com Stripe ou gateway de pagamento. Upgrade é gerenciado diretamente pela equipe Voxa (admin panel) ou via contato.
- ❌ **Upload de áudio no dashboard** — transcrições são feitas diretamente na API (`POST /api/v1/transcribe`), não neste portal.
- ❌ **Multi-tenancy / equipes** — uma conta = um usuário. Sem workspaces ou membros de equipe em v1.
- ❌ **Notificações em tempo real** — sem WebSocket ou push notifications. Trial expirando é mostrado na interface, não enviado por email/push.
- ❌ **Exportação de dados** — sem CSV/PDF de transcrições ou logs.
- ❌ **Internacionalização (i18n)** — interface em português/inglês sem suporte a múltiplos idiomas formais.
- ❌ **Temas / personalização** — dark mode é desejável mas não é prioridade v1.

---

## Conexão com a Voxa API

**Referência completa:** https://github.com/AndreClawdTeam/voxa-api

**Base URL:** `NEXT_PUBLIC_VOXA_API_URL` (variável de ambiente)

### Fluxo de Autenticação

```
1. POST /api/v1/auth/login
   → Body: { email, password }
   → Resposta: { data: { accessToken } }  (válido por 15min)
   → Cookie HttpOnly: refreshToken         (válido por 7 dias)

2. Toda requisição autenticada:
   → Header: Authorization: Bearer <accessToken>

3. Quando access token expira (401):
   → POST /api/v1/auth/refresh
   → Cookie refreshToken é lido automaticamente
   → Resposta: { data: { accessToken } }  (novo token)
   → Retry da requisição original

4. Logout:
   → POST /api/v1/auth/logout
   → Invalida refreshToken no servidor
   → Limpar cookie accessToken no client
```

**Dois tipos de autenticação na Voxa API:**
- `Bearer JWT` — para o dashboard (este projeto). Token de acesso de curta duração.
- `Bearer vxa_<hex>` — API Key do usuário, usada para chamar `/api/v1/transcribe`. O dashboard **gerencia** essas keys, mas **não as usa** para fazer transcrições.

### Endpoints Consumidos

```
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

# Customer — API Keys
GET    /api/v1/keys
POST   /api/v1/keys
DELETE /api/v1/keys/:id

# Customer — Dashboard
GET    /api/v1/dashboard/usage
GET    /api/v1/dashboard/transcriptions
GET    /api/v1/dashboard/transcriptions/:id
GET    /api/v1/dashboard/profile
PUT    /api/v1/dashboard/profile

# Customer — Assinatura
GET    /api/v1/subscriptions/current
POST   /api/v1/subscriptions/upgrade

# Admin
GET    /api/v1/admin/customers
GET    /api/v1/admin/customers/:id
PATCH  /api/v1/admin/customers/:id/subscription
GET    /api/v1/admin/audit-logs
```

### Formato de Resposta Padrão

```typescript
// Recurso único
{ "data": T }

// Lista paginada
{ "data": T[], "pagination": { "page": number, "limit": number, "total": number, "totalPages": number } }

// Erro
{ "error": string, "code": string }
{ "error": "Validation failed", "code": "VALIDATION_ERROR", "details": [{ "field": string, "message": string }] }
```

**Regra crítica:** Toda resposta da API deve ser validada com Zod antes de ser usada. Nunca use `as Type` — derive os tipos de schemas Zod com `z.infer<>`.

---

## Princípios de Arquitetura

### Next.js 16 com App Router

**Por quê:** App Router permite Server Components por default, eliminando waterfalls de dados — a página carrega com dados já populados no servidor, sem estados de loading adicionais no cliente. Server Actions substituem endpoints de API internos para mutações, reduzindo complexidade.

```
src/app/
├── (auth)/              # Grupo de rotas sem proteção (login, register)
│   ├── login/
│   └── register/
├── dashboard/           # Rotas protegidas — clientes
│   ├── page.tsx         # Overview
│   ├── api-keys/
│   ├── transcriptions/
│   ├── profile/
│   └── subscription/
└── admin/               # Rotas protegidas — admins apenas
    ├── customers/
    └── audit-logs/
```

### Server Components por Default

**Regra:** Todo componente é Server Component a menos que precise de:
- `useState`, `useEffect`, `useReducer`
- Event handlers (`onClick`, `onChange`)
- Acesso a APIs de browser (`window`, `document`, `localStorage`)
- Hooks do React (exceto `use()` para Server Components)

Se precisar de interatividade, extraia apenas o pedaço interativo em um Client Component (`'use client'`), mantendo os pais como Server Components.

### Server Actions para Mutações

Nenhum endpoint de API interno (`/app/api/...`). Todas as mutações usam Server Actions:

```typescript
// src/domains/api-keys/actions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function createApiKeyAction(formData: FormData) {
  // 1. Validar com Zod
  // 2. Chamar service (que chama a Voxa API)
  // 3. Revalidar cache
  // 4. Retornar resultado
}
```

### DDD — Domain-Driven Design

Código do mesmo domínio junto, na mesma pasta. Não organizar por tipo de arquivo.

```
src/domains/
├── api-keys/
│   ├── schemas.ts        # Zod schemas
│   ├── types.ts          # Tipos inferidos dos schemas
│   ├── service.ts        # Chamadas à Voxa API (via lib/services)
│   ├── actions.ts        # Server Actions
│   ├── helpers.ts        # Funções utilitárias do domínio
│   └── components/       # Componentes específicos deste domínio
│       ├── ApiKeyTable.tsx
│       ├── CreateApiKeyDialog.tsx
│       └── RevokeApiKeyButton.tsx
├── transcriptions/
├── subscriptions/
├── profile/
├── usage/
└── admin/
    ├── customers/
    └── audit-logs/
```

### Camada de Serviços Centralizada

**Regra de ouro:** Nenhum `fetch` fora de `src/lib/services/`.

```
src/lib/services/
├── http-client.ts    # voxaGet, voxaPost, voxaPut, voxaDelete, voxaPatch
├── errors.ts         # VoxaApiError, VoxaNetworkError, type guards
└── response-schemas.ts  # SingleResponseSchema, ListResponseSchema
```

O HTTP client gerencia: autenticação (Bearer token), retry no 401 (refresh automático), validação de resposta com Zod, e lançamento de erros tipados.

### Zod: Validação + Types (nunca `as Type`)

```typescript
// ✅ Correto
const ApiKeySchema = z.object({ id: z.string(), label: z.string(), isRevoked: z.boolean() })
type ApiKey = z.infer<typeof ApiKeySchema>

// ❌ Errado
const data = response as ApiKey
```

### TDD — Red-Green-Refactor

Escreva o teste antes da implementação. Foco em comportamento, não em implementação interna.

```typescript
// 1. RED — teste falha
it('should not allow closing the modal without confirming copy', () => {
  render(<RawTokenRevealStep rawToken="vxa_abc123" />)
  expect(screen.getByRole('button', { name: /fechar/i })).toBeDisabled()
})

// 2. GREEN — implementação mínima para passar
// 3. REFACTOR — melhora sem quebrar o teste
```

### React Context — Sem Prop Drilling

Para estado compartilhado entre Client Components (ex: usuário logado, access token, toasts), usar React Context em `src/domains/auth/context.tsx`.

### Segurança de Rotas

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  // Protege /dashboard/* → requer autenticação
  // Protege /admin/* → requer autenticação + role === 'admin'
  // Redireciona não-autenticados para /login
  // Redireciona customers tentando acessar /admin para /dashboard
}
```

### Checklist obrigatório antes de qualquer PR

```bash
npx biome check .          # lint — zero erros
npx biome format --check . # format — zero diffs
npx tsc --noEmit           # types — zero erros
npm run build              # build — sucesso
npm test -- --run          # testes — todos passando
```

---

## Estrutura de Pastas

```
src/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Rotas públicas (sem sidebar)
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/               # Rotas autenticadas — customers
│   │   ├── layout.tsx           # Sidebar do customer
│   │   ├── page.tsx             # Overview
│   │   ├── api-keys/
│   │   ├── transcriptions/
│   │   │   └── [id]/
│   │   ├── profile/
│   │   └── subscription/
│   ├── admin/                   # Rotas autenticadas — admins
│   │   ├── layout.tsx           # Sidebar do admin
│   │   ├── customers/
│   │   │   └── [id]/
│   │   └── audit-logs/
│   ├── layout.tsx               # Root layout
│   └── globals.css
├── domains/                     # Código organizado por domínio (DDD)
│   ├── api-keys/
│   ├── transcriptions/
│   ├── subscriptions/
│   ├── profile/
│   ├── usage/
│   └── admin/
│       ├── customers/
│       └── audit-logs/
├── components/                  # Componentes compartilhados (não-específicos de domínio)
│   └── ui/                     # shadcn/ui components
├── lib/                         # Utilitários e infra
│   ├── services/                # HTTP client centralizado
│   ├── auth/                    # Helpers de token (getAccessToken, etc.)
│   ├── zod/                     # Schemas Zod reutilizáveis
│   └── env.ts                   # Validação de variáveis de ambiente
├── middleware.ts                 # Proteção de rotas Next.js
└── test/                        # Setup de testes
    └── setup.ts
```

---

## Glossário do Domínio

| Termo | Definição |
|---|---|
| **API Key** | Credencial no formato `vxa_<64 hex chars>` que o cliente usa para chamar `POST /api/v1/transcribe`. Gerenciada no dashboard (criar/revogar), mas nunca usada por ele para transcrever. |
| **rawToken** | O valor real da API Key (`vxa_...`) — retornado **apenas uma vez** pela API no momento da criação. Após isso, inacessível para sempre. O dashboard deve exibir com aviso claro e botão de copiar. |
| **Trial** | Período de 7 dias iniciado automaticamente no cadastro, com rate limit de 20 req/min. Expirado o trial, a conta precisa de upgrade. |
| **Tier** | Nível do plano: `trial` (20 req/min, 7d), `basic` (60 req/min), `pro` (300 req/min). |
| **Subscription Status** | Estado atual da assinatura: `trial` (em período de avaliação), `active` (pago, vigente), `suspended` (pagamento pendente), `cancelled` (cancelada). |
| **Transcription** | Resultado de uma chamada à `POST /api/v1/transcribe`. Contém texto transcrito, idioma detectado, duração do áudio, tempo de processamento. Status: `pending → processing → completed | failed`. |
| **Usage** | Métricas de consumo do mês atual: número de transcrições, minutos de áudio processados. Endpoint: `GET /api/v1/dashboard/usage`. |
| **Audit Log** | Registro imutável de ações administrativas no sistema. Campos: quem fez (`actorId`, `actorRole`), o quê (`action`, `resourceType`, `resourceId`), sobre quem (`targetUserId`), contexto (`metadata`). |
| **Access Token** | JWT de curta duração (15min) usado para autenticar requisições ao dashboard. Armazenado em cookie HttpOnly `accessToken`. |
| **Refresh Token** | Token de longa duração (7 dias) em cookie HttpOnly `refreshToken`. Usado para renovar o access token silenciosamente via `POST /api/v1/auth/refresh`. |
| **Server Component** | Componente React executado exclusivamente no servidor. Pode fazer `await` diretamente, sem `useEffect`. Default no App Router. |
| **Server Action** | Função server-side invocada a partir de formulários ou Client Components. Substitui endpoints de API internos para mutações. |
| **DDD (Domain-Driven Design)** | Organização do código por domínio de negócio (ex: `domains/api-keys/`) em vez de por tipo de arquivo (ex: `components/`, `services/`). |
