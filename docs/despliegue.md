# Plan de despliegue (Etapa 10)

## Feature flags por país (REQ-SEC-05)

- Fuente de verdad: `countries.active` + revisión legal registrada en `audit_log` (`country_updated`).
- Efectos: registro paciente, listado de profesionales, reservas y pagos asociados al país.
- UI admin: `/admin/paises` → **Activar (tras revisión legal)**.

## Pipeline

1. PR → CI (`ci.yml` + `e2e.yml`).
2. Merge `main` → build artefacto Next.js.
3. Deploy a staging → smoke Playwright contra URL staging.
4. Checklist `docs/lanzamiento.md` sin críticos abiertos.
5. Deploy prod por país (AR primero) con `countries.active` gradual.

## Copia de seguridad verificada

- Backup automatizado Postgres (PITR si disponible).
- **Prueba de restore trimestral**: restaurar en instancia efímera, ejecutar `pnpm test` + smoke login.
- Registrar fecha y responsable en `docs/lanzamiento.md` (sección firmas).

## Reversión

- Mantener `N` y `N-1` releases en registro de contenedores.
- Rollback: reasignar tráfico a `N-1` + validar migraciones compatibles (solo aditivas).
- Si migración rompe compatibilidad: restaurar backup pre-deploy (ventana acordada).

## Variables críticas prod

- `APP_ENV=production`, `PAYMENT_MODE=live`
- `ADMIN_REQUIRE_MFA=1`, `ADMIN_SESSION_MAX_AGE_SEC=1200`
- Sin `MOCK_*` en producción
