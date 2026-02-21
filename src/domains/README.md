# domains/

Cada pasta neste diretório representa um domínio de negócio do voxa-dashboard.

## Convenção

Cada domínio contém:
- `schemas.ts` — Zod schemas (source of truth de tipos)
- `types.ts` — tipos inferidos dos schemas via `z.infer<>`
- `service.ts` — chamadas à Voxa API (APENAS via `src/lib/services/http-client`)
- `actions.ts` — Server Actions (mutações, marcadas com `'use server'`)
- `components/` — componentes React específicos deste domínio

## Regras

1. Nunca use `as Type` — sempre derive tipos de schemas Zod
2. Nunca faça `fetch()` fora de `src/lib/services/`
3. Server Components fazem `await service.fetchX()` diretamente
4. Client Components usam `useActionState` com Server Actions para mutações
5. Efeitos após Server Actions (toast, redirect) ficam no wrapper do `useActionState`, nunca em `useEffect`
