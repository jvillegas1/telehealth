# Agenda y reservas (REQ-MOD-05)

## Modelo

- **Reglas semanales** (`professional_availability_rules`): hora local del profesional (Luxon `weekday` 1–7).
- **Excepciones** (`professional_availability_exceptions`): `closed` | `extra_open`, intervalos en UTC.
- **Citas** (`appointments`): `scheduled_at` / `scheduled_end_at` en UTC; índice único parcial para evitar doble reserva.
- **Recordatorios** (`notification_jobs`): 24 h y 1 h antes, solo si `privacySettings.sessionReminders !== false`.

## Zonas horarias

Librería: **Luxon** (`packages/domain/src/scheduling/slots.ts`). Presentación al paciente con `patient_profiles.timezone`.

## Política de cancelación

Tabla `cancellation_policies` (por país o global). Visible antes de confirmar en `/profesionales/[id]/reservar`.

## Concurrencia

`bookAppointment()` → `ScheduleConflictError` con mensaje `SCHEDULE_SLOT_CONFLICT_MESSAGE`.

Test: `packages/db/src/integration/scheduling-concurrency.integration.test.ts`.

## Recordatorios

```bash
curl -X POST http://localhost:3000/api/internal/jobs/reminders -H "x-cron-secret: $CRON_SECRET"
```

En CI/dev: `MOCK_NOTIFICATIONS=1`.

## Rutas UI

| Ruta                           | Rol          |
| ------------------------------ | ------------ |
| `/profesional/agenda`          | Professional |
| `/profesionales/[id]/reservar` | Patient      |
| `/citas`                       | Patient      |

Capturas: `docs/screenshots/scheduling/README.md`.
