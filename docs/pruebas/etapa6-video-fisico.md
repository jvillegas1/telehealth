# Prueba física — videollamada (Etapa 6)

## Pre-requisitos

- Migraciones `0010` y `0011` aplicadas.
- `MOCK_LIVEKIT=0` y credenciales LiveKit válidas (o `MOCK_LIVEKIT=1` para smoke sin WebRTC).
- Cita `confirmed` con pago `approved` y horario dentro de ventana ±15 min.

## Checklist móvil (paciente)

1. Abrir `/citas` → **Ir a la sesión**.
2. En sala de espera, aceptar permisos de cámara/mic; verificar mensaje si se deniegan.
3. Ingresar a videollamada; probar **Solo audio**.
4. Usar **Respiración guiada** y **Compartir pizarra**.

## Checklist escritorio (profesional)

1. Misma cita → `/sesion/[id]/control`.
2. Verificar aviso de consentimiento de ficha.
3. Guardar notas; confirmar mensaje de cifrado.
4. Solicitar grabación; confirmar que no activa hasta doble OK.

## Navegadores (Playwright)

```bash
E2E_VIDEO=1 MOCK_LIVEKIT=1 npx pnpm@9.15.0 exec playwright test -c apps/web/playwright.config.ts
```
