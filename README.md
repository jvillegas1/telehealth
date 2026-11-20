# Telehealth — Plataforma de telepsicología

Monorepo (pnpm + Turborepo) para la plataforma web/PWA que conecta pacientes con psicólogos certificados.

## Arranque en 3 comandos

```bash
npx pnpm@9.15.0 install
npx pnpm@9.15.0 test
npx pnpm@9.15.0 build
```

Desarrollo local de la app web:

```bash
npx pnpm@9.15.0 dev
```

Copia `.env.example` a `apps/web/.env.local` si necesitas sobrescribir variables. Los valores por defecto de desarrollo están en `apps/web/.env.development` (sin secretos).

## Estructura

| Ruta                     | Descripción                  |
| ------------------------ | ---------------------------- |
| `apps/web`               | Next.js (App Router), PWA    |
| `packages/ui`            | Componentes compartidos      |
| `packages/domain`        | Dominio (fases posteriores)  |
| `packages/db`            | Drizzle / PostgreSQL         |
| `packages/config`        | TS, ESLint, entornos Zod     |
| `docs/trazabilidad.md`   | Matriz de requisitos         |
| `docs/lanzamiento.md`    | Checklist e informe Etapa 10 |
| `docs/adr/0001-stack.md` | ADR del stack                |

## Requisitos

- Node.js ≥ 22.11.0
- pnpm 9.15.0 (vía Corepack o `npx pnpm@9.15.0`)

## Commits

Convencionales + ID de requisito, por ejemplo: `chore(infra): bootstrap monorepo REQ-INFRA-01`

## Remoto

https://github.com/jvillegas1/telehealth
