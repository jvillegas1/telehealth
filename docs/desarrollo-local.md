# Guía paso a paso — instalación y ejecución local

Esta guía asume **Windows, macOS o Linux** con acceso a terminal. La aplicación web vive en `apps/web`; la base de datos es **PostgreSQL**.

## 1. Requisitos previos

| Herramienta                   | Versión mínima   | Comprobar                           |
| ----------------------------- | ---------------- | ----------------------------------- |
| **Node.js**                   | 22.11.0          | `node -v`                           |
| **pnpm**                      | 9.15.0           | `pnpm -v` o usar `npx pnpm@9.15.0`  |
| **Git**                       | cualquiera       | `git --version`                     |
| **PostgreSQL**                | 16 (recomendado) | vía Docker **o** instalación nativa |
| **Docker Desktop** (opcional) | reciente         | `docker compose version`            |

> **Nota:** Sin base de datos activa, la home carga pero **el login falla** (no hay usuarios ni Auth contra BD).

Opcional para videollamada y cobros en local:

- Cuenta **LiveKit** (`LIVEKIT_*`) o `MOCK_LIVEKIT=1` en `apps/web/.env.local`
- **Anthropic** para evaluación conversacional o `MOCK_CLAUDE=1` en CI/local

## 2. Clonar el repositorio

```bash
git clone https://github.com/jvillegas1/telehealth.git
cd telehealth
```

Si ya tenés el repo, actualizá la rama de trabajo:

```bash
git pull
```

## 3. Instalar dependencias

Desde la raíz del monorepo:

```bash
npx pnpm@9.15.0 install
```

Verificación rápida (opcional):

```bash
npx pnpm@9.15.0 test
npx pnpm@9.15.0 build
```

## 4. Variables de entorno

### Opción A — usar los valores de desarrollo del repo

El proyecto incluye `apps/web/.env.development` con valores de **solo desarrollo** (Postgres local, MFA desactivado, sandbox de pagos). Next.js los carga automáticamente en `pnpm dev`.

### Opción B — sobrescribir con `.env.local`

```bash
cp .env.example apps/web/.env.local
```

Editá `DATABASE_URL`, `ENCRYPTION_KEY` y secretos si tu entorno difiere. **No commitees** `.env.local` ni secretos reales.

Variables clave en local:

| Variable         | Ejemplo / valor dev                                            |
| ---------------- | -------------------------------------------------------------- |
| `DATABASE_URL`   | `postgresql://postgres:postgres@localhost:5432/telehealth`     |
| `ENCRYPTION_KEY` | 32+ caracteres (debe coincidir con la usada al crear usuarios) |
| `AUTH_SECRET`    | 32+ caracteres                                                 |
| `REQUIRE_MFA`    | `0` en dev (login sin TOTP)                                    |

## 5. Levantar PostgreSQL

### 5.1 Con Docker (recomendado)

Desde la raíz:

```bash
docker compose up -d --wait
```

El servicio expone el puerto **5432** y crea la base `telehealth`.

Comando combinado (Postgres + migraciones + usuario admin):

```bash
npx pnpm@9.15.0 db:setup
```

### 5.2 Sin Docker

1. Instalá PostgreSQL 16.
2. Creá la base `telehealth` y un usuario con permisos.
3. Ajustá `DATABASE_URL` en `apps/web/.env.local` o `.env.development`.

Comprobá que el puerto responde (PowerShell en Windows):

```powershell
Test-NetConnection -ComputerName localhost -Port 5432
```

## 6. Migraciones y datos demo

### Solo usuario administrador (auditoría)

```bash
npx pnpm@9.15.0 db:create-admin
```

Crea o actualiza:

| Campo          | Valor                            |
| -------------- | -------------------------------- |
| Email          | `admin@example.test`             |
| Contraseña     | `DemoPass-2025!`                 |
| Roles internos | `verifier`, `finance`, `support` |

### Dataset completo anonimizado (pacientes, profesional, agenda)

```bash
npx pnpm@9.15.0 --filter @telehealth/db exec tsx src/seed/run-seed.ts
```

Requiere `DATABASE_URL` y `ENCRYPTION_KEY` en el entorno (el script de admin carga `apps/web/.env.development` si hace falta).

Migraciones manuales:

```bash
npx pnpm@9.15.0 --filter @telehealth/db db:migrate
```

## 7. Ejecutar la aplicación

```bash
npx pnpm@9.15.0 dev
```

- URL: [http://localhost:3000](http://localhost:3000)
- Turbopack habilitado (`next dev --turbopack`)

### Ingreso y rutas útiles

| Rol         | Ruta tras login                                            |
| ----------- | ---------------------------------------------------------- |
| Admin       | [http://localhost:3000/admin](http://localhost:3000/admin) |
| Profesional | `/profesional/agenda`                                      |
| Paciente    | `/consentimiento` (flujo onboarding)                       |

Página de ingreso: [http://localhost:3000/ingreso](http://localhost:3000/ingreso)

## 8. Comandos frecuentes

| Comando                | Descripción                                   |
| ---------------------- | --------------------------------------------- |
| `pnpm dev`             | Servidor de desarrollo                        |
| `pnpm build`           | Build de producción (turbo)                   |
| `pnpm lint`            | ESLint en paquetes                            |
| `pnpm typecheck`       | TypeScript                                    |
| `pnpm test`            | Tests unitarios / paquetes                    |
| `pnpm test:e2e:launch` | E2E lanzamiento (instala browsers Playwright) |
| `pnpm db:up`           | Solo Postgres en Docker                       |
| `pnpm db:setup`        | Postgres + admin demo                         |
| `pnpm db:create-admin` | Migrar + admin demo                           |

Build y servidor de producción local (tras `build`):

```bash
npx pnpm@9.15.0 build
npx pnpm@9.15.0 --filter @telehealth/web start
```

## 9. Solución de problemas

### «No pudimos iniciar sesión» en `/ingreso`

1. Verificá que Postgres esté activo (`docker compose ps` o puerto 5432).
2. Ejecutá `pnpm db:create-admin`.
3. Reiniciá `pnpm dev` tras cambiar `.env`.
4. En `/ingreso` debe **no** aparecer el aviso de base de datos caída.

### Error de hidratación en consola (`data-lt-installed`)

Suele ser una extensión del navegador (p. ej. LanguageTool). Probá ventana de incógnito sin extensiones.

### Avisos `Package pg can't be external`

Asegurate de haber corrido `pnpm install` en la raíz; `pg` está declarado en `apps/web`.

### MFA en desarrollo

Con `REQUIRE_MFA=0` no hace falta código TOTP. En staging/prod no uses esa variable.

### Videollamada / Claude sin credenciales

En `apps/web/.env.local`:

```env
MOCK_LIVEKIT=1
MOCK_CLAUDE=1
```

(Consultá `.env.example` y `docs/video.md` para integración real.)

## 10. Documentación relacionada

- [README](../README.md) — visión general del monorepo
- [admin.md](./admin.md) — consola de administración
- [database-schema.md](./database-schema.md) — esquema y migraciones
- [staging.md](./staging.md) — entorno staging
- [lanzamiento.md](./lanzamiento.md) — checklist Etapa 10
