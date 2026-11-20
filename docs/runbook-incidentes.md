# Runbook de incidentes (Etapa 10 §7.2)

## Severidades

| Nivel | Ejemplo                             | SLA respuesta    |
| ----- | ----------------------------------- | ---------------- |
| S1    | Filtración de datos, caída total    | 15 min           |
| S2    | Pagos fallidos masivos, video caído | 1 h              |
| S3    | Error aislado, degradación parcial  | 4 h              |
| S4    | Cosmético, workaround disponible    | siguiente sprint |

## S1 — Posible filtración de ficha / credenciales

1. Designar incident commander.
2. Revocar sesiones admin (`auth_sessions`), rotar `AUTH_SECRET` si comprometida.
3. Revisar `audit_log` y `sensitive_access_grants` últimas 24 h.
4. Comunicación a DPO / legal según país.
5. Post-mortem en 5 días hábiles.

## S2 — Videollamadas (LiveKit)

1. Verificar estado del proveedor y credenciales.
2. Activar mensaje en sala de espera; ofrecer reprogramar cita.
3. Si `MOCK_LIVEKIT=1` en prod → corregir configuración inmediata.

## S2 — Pagos / liquidaciones

1. Detener cron `POST /api/internal/jobs/settlements` si duplicados.
2. Reconciliar con `packages/domain/src/billing/reconciliation`.
3. Pausar país (`countries.active=false`) si pasarela regional falla.

## Reversión rápida

1. Redeploy imagen anterior (ver `docs/despliegue.md`).
2. Migraciones: solo forward; revertir datos con backup, no `down` en prod.
3. Feature flag país: desactivar en `/admin/paises`.

## Contactos (rellenar en org)

- Producto: \_
- Seguridad: \_
- Accesibilidad: \_
- On-call ingeniería: \_
