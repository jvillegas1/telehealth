# Cobros y liquidaciones (Módulo 4.7)

## Comisiones

- Tabla `commission_rules` versionada por país.
- Al **aceptar** una cita (`pending` → `confirmed`), el pago pasa a `approved` con snapshot (`commission_cents`, `net_cents`, `commission_rule_version`).

## Flujo paciente / profesional

1. Paciente reserva → cita `pending`, pago `pending`.
2. Profesional en `/profesional/citas` ve bruto, comisión y neto.
3. Aceptar → pago aprobado en sandbox + recordatorios.
4. Rechazar → cita cancelada, pago `rejected`.

## Liquidaciones

- Job: `POST /api/internal/jobs/settlements` con `x-cron-secret`.
- `MOCK_SETTLEMENTS=1` marca lotes como `paid`.
- Estados: `calculated`, `in_process`, `paid`, `failed`.

## Migraciones

- `0012_billing_commissions.sql`
- `0013_billing_rls.sql`

## Capturas (PR)

Colocar en `docs/screenshots/billing/`:

- `desktop-panel.png`
- `mobile-list.png`
- `appointment-accept-breakdown.png`
