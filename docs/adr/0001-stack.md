# ADR 0001: Stack tecnológico de la plataforma

- **Estado:** Aceptado
- **Fecha:** 2025-11-16
- **Requisitos:** REQ-ARCH-01..09, REQ-INFRA-01

## Contexto

El documento técnico (§3) define una PWA responsive, API con autenticación por roles, base relacional con datos de salud cifrados, videollamada WebRTC, bot de IA con salida estructurada y capa de pagos por país. El equipo acordó validar el stack con Next.js, TypeScript estricto, Tailwind/shadcn, Drizzle, Zod, Vitest/Playwright y LiveKit.

## Decisión

| Capa | Tecnología |
|------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Cliente | Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui (fase 1+) |
| Validación | Zod (entornos y contratos) |
| Persistencia | PostgreSQL + Drizzle ORM |
| Tests | Vitest (unitario), Playwright (E2E, fases posteriores) |
| Videollamada | LiveKit (WebRTC gestionado) |
| Pagos | `PaymentProvider` + adaptadores por país |
| CI | GitHub Actions (lint, typecheck, test, build, audit, gitleaks) |

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| **Nx** en lugar de Turborepo | Mayor complejidad inicial; Turborepo cubre pipelines del monorepo con menor curva |
| **Next.js Pages Router** | App Router alinea mejor con layouts, RSC y roadmap del ecosistema |
| **Prisma** | Drizzle ofrece SQL explícito y tipos ligeros; encaja con esquemas sensibles auditables |
| **Vite SPA sin SSR** | Peor SEO y arranque para flujos de pago/sesión; PWA con Next unifica web/móvil |
| **NestJS BFF separado (fase 0)** | Next Route Handlers + paquetes bastan para MVP; se reevalúa si crece el tráfico de API |
| **Agnóstico WebRTC propio** | LiveKit reduce operación de TURN/coturn y acelera Fase 2 |
| **Pasarela única global** | Incumple REQ-VIS-07 y REQ-ARCH-09 (localización real por país) |

## Consecuencias

- Despliegue natural de `apps/web` en Vercel o equivalente; Postgres gestionado para `packages/db`.
- Los secretos viven solo en el entorno (REQ-INFRA-04); validación Zod al arrancar.
- shadcn/ui y esquema Drizzle de negocio entran en PRs de Fase 1 (un cambio por PR).
- LiveKit y adaptadores de pago se integran tras el bootstrap, sin acoplar proveedor en el núcleo.

## Referencias

- Documento técnico plataforma de telepsicología, §3 y §8.
- `docs/trazabilidad.md`.