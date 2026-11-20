# Entorno staging (REQ-QA-03, REQ-ARCH-03)

Staging es un espejo de producción con diferencias controladas:

| Aspecto        | Staging                           | Producción   |
| -------------- | --------------------------------- | ------------ |
| `APP_ENV`      | `staging`                         | `production` |
| `PAYMENT_MODE` | `sandbox` (forzado por Zod)       | `live`       |
| Datos          | seed `anonymized`                 | datos reales |
| LiveKit        | credenciales de proyecto staging  | producción   |
| MFA admin      | recomendado `ADMIN_REQUIRE_MFA=1` | obligatorio  |

## Aprovisionamiento

1. Postgres dedicado + migraciones `0010`–`0015`.
2. Variables según `.env.example` (bloque staging).
3. `ENCRYPTION_KEY` y `AUTH_SECRET` distintos de prod (rotación documentada).
4. Seed: `pnpm --filter @telehealth/db exec tsx src/seed/run-seed.ts` (ver `packages/db/src/seed/anonymized.ts`).
5. `MOCK_SETTLEMENTS=1` y pasarela sandbox hasta validación finance.
6. Países: dejar `countries.active=false` hasta checklist legal; activar solo AR demo tras revisión.

## Validación post-deploy

- `pnpm test` y `pnpm test:e2e:launch` contra URL staging (`PLAYWRIGHT_BASE_URL`).
- Login paciente/pro/admin demo.
- Reserva → aceptación → cobro sandbox → liquidación mock.

## Copia de seguridad

- Snapshot diario de Postgres (retención 14 días en staging, 30 en prod).
- Restauración de prueba mensual documentada en `docs/despliegue.md`.
