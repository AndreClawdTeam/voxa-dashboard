# Voxa Dashboard

Dashboard web para clientes e administradores da plataforma **Voxa** — API de transcrição de áudio.

![CI](https://github.com/AndreClawdTeam/voxa-dashboard/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## Pré-requisitos

- Node.js 20+
- npm 10+

## Setup local

```bash
# 1. Instalar dependências
npm ci

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3001

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Servidor de produção |
| `npm run lint` | Lint com Biome |
| `npm run format` | Formatar código com Biome |
| `npm run typecheck` | Verificação de tipos TypeScript |
| `npm test` | Testes em modo watch (Vitest) |
| `npm run test:run` | Testes em modo CI (sem watch) |
| `npm run test:coverage` | Testes com cobertura |

## Arquitetura

Este projeto segue uma arquitetura DDD com domínios isolados. Consulte [CLAUDE.md](./CLAUDE.md) para detalhes da arquitetura, stack técnica, padrões de API e decisões técnicas.

## CI/CD

Pull Requests são verificados automaticamente com:
- ✅ Lint + format (Biome)
- ✅ Type check (TypeScript)
- ✅ Testes (Vitest)
- ✅ Build de produção
- ✅ Verificação de fetch direto (proibido fora de `src/lib/services/`)

### Branch protection recomendada para `main`

1. Acesse Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. Marque: ✅ Require status checks to pass before merging
4. Selecione o check: `quality`
5. Marque: ✅ Require branches to be up to date before merging
6. Marque: ✅ Do not allow bypassing the above settings
