# Videollamadas (LiveKit, REQ-MOD-04)

## Variables

- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` — servidor LiveKit.
- `MOCK_LIVEKIT=1` — tokens simulados y UI sin WebRTC real (CI y dev).
- `PAYMENT_MODE=sandbox` — pago auto-aprobado al reservar; token exige `payments.status = approved`.

## Rutas

| Ruta                              | Rol                    |
| --------------------------------- | ---------------------- |
| `/sesion/[appointmentId]/espera`  | Paciente / profesional |
| `/sesion/[appointmentId]`         | Videollamada           |
| `/sesion/[appointmentId]/control` | Solo profesional       |

## APIs

- `GET /api/sessions/[appointmentId]/token` — token LiveKit (ventana ±15 min, cita confirmada, pago aprobado).
- `GET/PATCH /api/sessions/[appointmentId]/notes` — notas cifradas (profesional).
- `POST /api/sessions/[appointmentId]/recording` — doble consentimiento de grabación.

## Migraciones

- `0010_video_sessions.sql` — campos LiveKit en `therapy_sessions`, scope `session_recording`.
- `0011_video_sessions_rls.sql` — políticas RLS de participantes.

## E2EE y grabación

E2EE activado por defecto (`therapy_sessions.e2ee_enabled`). Grabación desactivada hasta consentimiento paciente y profesional.
