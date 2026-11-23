# Administración (Módulo 4.8)

## Usuario demo (desarrollo)

Tras tener Postgres y `DATABASE_URL` + `ENCRYPTION_KEY` (mismo valor que usa `apps/web`):

```bash
npx pnpm@9.15.0 db:create-admin
```

| Campo      | Valor demo           |
| ---------- | -------------------- |
| Email      | `admin@example.test` |
| Contraseña | `DemoPass-2025!`     |

Ingreso en `/ingreso` → consola en `/admin`.

En desarrollo local MFA está desactivado (`REQUIRE_MFA=0` en `apps/web/.env.development`).

## Seguridad

- MFA obligatorio en staging/prod (`REQUIRE_MFA` distinto de `0`, `ADMIN_REQUIRE_MFA=1`).
- Sesión admin corta: `ADMIN_SESSION_MAX_AGE_SEC` (default 1200).

## Roles internos

`verifier`, `finance`, `support` en `admin_staff_assignments`.

## Migraciones

- `0014_admin_ops.sql`
- `0015_admin_rls.sql`

## Capturas PR

Colocar en `docs/screenshots/admin/`.
