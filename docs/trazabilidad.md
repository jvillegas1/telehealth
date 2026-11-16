# Matriz de trazabilidad

Fuente: *Documento Técnico Plataforma de Telepsicología*, secciones 1–8.

| ID | Requisito | Etapa | Rama/PR | Test | Estado |
|----|-----------|-------|---------|------|--------|
| REQ-VIS-01 | Plataforma web/móvil que conecta pacientes con psicólogos certificados sin consultorio | Fase 1 | — | — | Pendiente |
| REQ-VIS-02 | Alcance: autoevaluación, perfiles, ficha, video, agenda, pagos/cobros, administración | Fase 1–3 | — | — | Pendiente |
| REQ-VIS-03 | Fuera de alcance: diagnóstico clínico, emergencias, prescripción | — | — | — | Pendiente |
| REQ-VIS-04 | Autoevaluación orientativa; sugiere perfil profesional | Fase 1 | — | — | Pendiente |
| REQ-VIS-05 | Acceso sin fricción: autoevaluación → sesión agendada | Fase 1 | — | — | Pendiente |
| REQ-VIS-06 | Privacidad por defecto; datos de salud solo con consentimiento explícito | Fase 1 | — | — | Pendiente |
| REQ-VIS-07 | Localización real: pago, moneda e idioma por país | Fase 3 | — | — | Pendiente |
| REQ-ROLE-01 | Rol Paciente: autoevaluación, elección, agenda, pago, sesión | Fase 1 | — | — | Pendiente |
| REQ-ROLE-02 | Rol Profesional: perfil, ficha, agenda, sesión control, cobros | Fase 1–2 | — | — | Pendiente |
| REQ-ROLE-03 | Rol Administrador: credenciales, pagos, moderación, países | Fase 3 | — | — | Pendiente |
| REQ-ROLE-04 | Flujo: autoeval → resultado orientativo → selección → ficha → agenda → pago → video | Fase 1–2 | — | — | Pendiente |
| REQ-ARCH-01 | Cliente web responsive instalable como PWA | F0 / Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | build `apps/web` | En progreso |
| REQ-ARCH-02 | API backend + autenticación por roles | Fase 1 | — | — | Pendiente |
| REQ-ARCH-03 | Separación de entornos dev / staging / prod | F0 | `chore/bootstrap-monorepo-req-infra-01` | `packages/config/src/env/schema.test.ts` | En progreso |
| REQ-ARCH-04 | Servicios/módulos independientes | F0 / Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | turbo pipeline | En progreso |
| REQ-ARCH-05 | BD relacional: usuarios, profesionales, fichas, sesiones, pagos | Fase 1 | — | — | Pendiente |
| REQ-ARCH-06 | Datos de salud cifrados en reposo | Fase 1 | — | — | Pendiente |
| REQ-ARCH-07 | Videollamada WebRTC con proveedor gestionado | Fase 2 | — | — | Pendiente |
| REQ-ARCH-08 | Bot IA: prompts controlados, salida estructurada, riesgo | Fase 1 | — | — | Pendiente |
| REQ-ARCH-09 | Capa de abstracción de pagos por país | Fase 3 | — | — | Pendiente |
| REQ-MOD-01 | Autoevaluación guiada; ficha; consentimiento; no diagnóstico; crisis | Fase 1 | `feat/assessment-req-mod-01` | `packages/domain/src/assessment/__tests__/battery.test.ts`, e2e resume | En progreso |
| REQ-ETH-08 | Protocolo de crisis con recursos del país | Fase 1 | `feat/assessment-req-mod-01` | crisis_resources + risk engine | En progreso |
| REQ-MOD-02 | Selección y filtros de profesionales | Fase 1 | `feat/professionals-req-mod-02-03` | `packages/domain/src/professionals/__tests__/recommendation.cases.test.ts`, `apps/web/src/server/professionals/list-guard.test.ts` | En progreso |
| REQ-MOD-03 | Perfil profesional y verificación de credenciales | Fase 1 | `feat/professionals-req-mod-02-03` | onboarding/admin API, `docs/recommendation-rules.md` | En progreso |
| REQ-MOD-04 | Videollamada in-web y herramientas de sesión | Fase 2 | — | — | Pendiente |
| REQ-MOD-05 | Schedule: disponibilidad, reservas, TZ, cancelación | Fase 2 | — | — | Pendiente |
| REQ-MOD-06 | Pago usuario por país y estados del cobro | Fase 3 | — | — | Pendiente |
| REQ-MOD-07 | Cobro profesional y liquidaciones | Fase 3 | — | — | Pendiente |
| REQ-MOD-08 | Administración y auditoría | Fase 3 | — | — | Pendiente |
| REQ-SEC-01 | Cifrado en tránsito/reposo; video E2E | Fase 1–2 | — | — | Pendiente |
| REQ-SEC-02 | Consentimiento explícito y revocable de ficha | Fase 1 | — | — | Pendiente |
| REQ-SEC-03 | Mínimo privilegio; acceso a ficha en audit_log | Fase 1 | — | — | Pendiente |
| REQ-SEC-04 | Grabación desactivada por defecto | Fase 2 | — | — | Pendiente |
| REQ-SEC-05 | Normativa local por país antes de activar | Fase 3 | — | — | Pendiente |
| REQ-SEC-06 | Retención, exportación y borrado | Fase 3 | — | — | Pendiente |
| REQ-UX-01 | Baja estimulación visual | Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | revisión visual landing | En progreso |
| REQ-UX-02 | Accesibilidad WCAG (contraste, teclado, foco) | Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | `globals.css` focus-visible | En progreso |
| REQ-UX-03 | Móvil primero (360px) | Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | layout Tailwind | En progreso |
| REQ-UX-04 | Lenguaje claro sin alarmismo | Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | copy `page.tsx` | En progreso |
| REQ-UX-05 | Estados carga/vacío/error/éxito por módulo | Fase 1 | — | — | Pendiente |
| REQ-UX-06 | Estados vacío/error específicos por flujo | Fase 1–3 | — | — | Pendiente |
| REQ-QA-01 | E2E multi-navegador y viewports móviles | Fase 1+ | — | Playwright (fases posteriores) | Pendiente |
| REQ-QA-02 | Pruebas físicas iOS/Android A/V | Fase 2 | — | — | Pendiente |
| REQ-QA-03 | Staging prod-like; pagos sandbox; datos anonimizados | F0 / Fase 3 | `chore/bootstrap-monorepo-req-infra-01` | `schema.test.ts` staging | En progreso |
| REQ-ETH-01 | Diagnóstico solo orientativo comunicado al usuario | Fase 1 | `chore/bootstrap-monorepo-req-infra-01` | copy `page.tsx` | En progreso |
| REQ-ETH-02 | Cobro transparente al profesional | Fase 3 | — | — | Pendiente |
| REQ-ETH-03 | Cero alertas persuasivas | Fase 2 | — | — | Pendiente |
| REQ-ETH-04 | Política de privacidad coherente | Fase 3 | — | — | Pendiente |
| REQ-ETH-05 | Perfiles con credenciales validadas por admin | Fase 3 | — | — | Pendiente |
| REQ-ETH-06 | Pagos sandbox en staging | F0 / Fase 3 | `chore/bootstrap-monorepo-req-infra-01` | `schema.test.ts` | En progreso |
| REQ-ETH-07 | Pantalla de pago transparente | Fase 3 | — | — | Pendiente |
| REQ-ETH-08 | Protocolo de crisis con recursos del país | Fase 1 | — | — | Pendiente |
| REQ-ETH-09 | Sin Lorem Ipsum ni botones sin función | F0 | `chore/bootstrap-monorepo-req-infra-01` | revisión landing | En progreso |
| REQ-ROAD-01 | Fase 1 (sem 1–4): entornos, DB, autoeval, perfiles | Fase 1 | — | — | Pendiente |
| REQ-ROAD-02 | Fase 2 (sem 5–8): video, schedule, beta | Fase 2 | — | — | Pendiente |
| REQ-ROAD-03 | Fase 3 (sem 9–12): pagos, admin, producción | Fase 3 | — | — | Pendiente |
| REQ-INFRA-01 | Monorepo pnpm + Turborepo | F0 | `chore/bootstrap-monorepo-req-infra-01` | `turbo test/build` | En progreso |
| REQ-INFRA-02 | TS estricto, ESLint, Prettier, commitlint, husky | F0 | `chore/bootstrap-monorepo-req-infra-01` | CI lint | En progreso |
| REQ-INFRA-03 | CI lint, typecheck, test, build, audit, secretos | F0 | `chore/bootstrap-monorepo-req-infra-01` | `.github/workflows/ci.yml` | En progreso |
| REQ-INFRA-04 | Variables de entorno validadas con Zod | F0 | `chore/bootstrap-monorepo-req-infra-01` | `schema.test.ts`, `env.server.test.ts` | En progreso |
| REQ-INFRA-05 | Matriz `docs/trazabilidad.md` | F0 | `chore/bootstrap-monorepo-req-infra-01` | — | En progreso |
| REQ-INFRA-06 | ADR 0001 | F0 | `chore/bootstrap-monorepo-req-infra-01` | — | En progreso |
| REQ-INFRA-07 | README arranque 3 comandos | F0 | `chore/bootstrap-monorepo-req-infra-01` | — | En progreso |