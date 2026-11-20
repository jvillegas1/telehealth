# Administración (Módulo 4.8)

## Seguridad

- MFA obligatorio salvo `ADMIN_REQUIRE_MFA=0` en desarrollo.
- Sesión admin corta: `ADMIN_SESSION_MAX_AGE_SEC` (default 1200).

## Roles internos

`verifier`, `finance`, `support` en `admin_staff_assignments`.

## Migraciones

- `0014_admin_ops.sql`
- `0015_admin_rls.sql`

## Capturas PR

Colocar en `docs/screenshots/admin/`.
