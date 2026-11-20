# Informe de lanzamiento — Etapa 10

**Fecha:** 2025-11-20  
**Rama:** `feat/professionals-req-mod-02-03`  
**Documento fuente:** secciones 6.3 y 7.2 (pruebas, staging, checklist de lanzamiento)

---

## Resumen ejecutivo

| Ítem                          | Resultado                                  | REQ principal           |
| ----------------------------- | ------------------------------------------ | ----------------------- |
| E2E multi-navegador + móvil   | **OK** (suite `test:e2e:launch`)           | REQ-QA-01               |
| axe (WCAG AA)                 | **OK** Chromium + WebKit + móvil           | REQ-UX-02               |
| Lectores de pantalla (manual) | **Pendiente firma**                        | REQ-QA-01, REQ-UX-02    |
| Revisión de textos            | **OK** (sin Lorem; sin alarmismo en smoke) | REQ-ETH-09, REQ-UX-04   |
| Staging                       | **Documentado** `docs/staging.md`          | REQ-QA-03               |
| Privacidad                    | **OK** política ampliada                   | REQ-ETH-04, REQ-VIS-06  |
| Carga básica                  | **Script** `tools/load/booking-spike.mjs`  | REQ-QA-01               |
| Despliegue / rollback         | **Documentado**                            | REQ-SEC-05, REQ-ARCH-03 |
| Críticos abiertos             | **0**                                      | —                       |
| Hallazgos no críticos         | Ver `docs/issues/launch-findings.md`       | —                       |

---

## 1. E2E — Chrome, Firefox, Safari (WebKit), Edge y móvil

**Comando:** `pnpm test:e2e:launch` (desde raíz; instala Chromium/Firefox/WebKit).

**Especificaciones:** `apps/web/e2e/launch-smoke.spec.ts`, `apps/web/e2e/a11y-flows.spec.ts`  
**Config:** `apps/web/playwright.config.ts` — proyectos `chromium`, `firefox`, `webkit` (Safari), `edge`, `mobile-chrome`, `mobile-safari`.

**Última ejecución local:** 66 passed, 12 skipped (axe omitido en Firefox/Edge), ~2.3 min.

| Proyecto      | Smoke | axe                           |
| ------------- | ----- | ----------------------------- |
| chromium      | 7/7   | 6/6                           |
| firefox       | 7/7   | omitido (smoke cubre Firefox) |
| webkit        | 7/7   | 6/6                           |
| edge          | 7/7\* | omitido                       |
| mobile-chrome | 7/7   | 6/6                           |
| mobile-safari | 7/7   | 6/6                           |

\*Edge ocasionalmente lento; usar `retries: 2` en CI. Smoke valida motor Edge en Windows.

**Flujos con DB** (requieren migraciones + flags): `E2E_SCHEDULE`, `E2E_VIDEO`, `E2E_BILLING`, `E2E_ADMIN`, `E2E_ASSESSMENT` — ver specs en `apps/web/e2e/`.

**CI:** `.github/workflows/e2e.yml` — artefacto `playwright-report/`.

**Evidencia:** `apps/web/playwright-report/results.json`, `docs/screenshots/launch/`.

---

## 2. Accesibilidad

### axe (automático)

- Rutas paciente: `/`, `/autoevaluacion`, `/privacidad`, `/consentimiento`
- Rutas acceso profesional: `/ingreso`, `/registro`
- Umbral: sin violaciones **critical** ni **serious** (WCAG 2.1 AA).

### Manual VoiceOver / TalkBack

Checklist: `docs/pruebas/etapa10-accesibilidad-manual.md`  
**Estado:** pendiente sesión firmada por responsable de accesibilidad (sin bloqueadores críticos en código).

---

## 3. Revisión de textos (REQ-ETH-09, REQ-ETH-03)

| Verificación                  | Resultado                                                        |
| ----------------------------- | ---------------------------------------------------------------- |
| Lorem Ipsum en UI             | No encontrado (`rg` + smoke)                                     |
| Botones sin función           | Solo estados deshabilitados con etiqueta (p. ej. sala de espera) |
| Lenguaje alarmista/persuasivo | Patrones excluidos en smoke e2e                                  |

---

## 4. Staging

Ver `docs/staging.md`: `APP_ENV=staging`, `PAYMENT_MODE=sandbox`, seed `packages/db/src/seed/run-seed.ts`, datos anonimizados.

---

## 5. Privacidad (REQ-ETH-04)

- Página `/privacidad` alineada con cifrado, consentimiento, retención, ausencia de publicidad de terceros.
- Sin scripts de analytics publicitarios en `apps/web` (verificado por búsqueda en repo).
- Consentimiento de ficha: `/consentimiento` + API `consents`.

**Pendiente medio (no crítico):** borrado autogestionado → LF-01 en `docs/issues/launch-findings.md`.

---

## 6. Pruebas de carga básicas

**Script:** `node tools/load/booking-spike.mjs http://localhost:3000 25 120`  
Ejecutar con `pnpm start` activo. Registrar `avgMs`, `p95Ms`, `errors` en la tabla de staging/pre-prod.

---

## 7. Plan de despliegue

| Tema                  | Referencia                                         |
| --------------------- | -------------------------------------------------- |
| Feature flag por país | `countries.active`, UI `/admin/paises`             |
| Backup y restore      | `docs/despliegue.md`                               |
| Reversión             | `docs/despliegue.md`, `docs/runbook-incidentes.md` |
| Incidentes            | `docs/runbook-incidentes.md`                       |

---

## 8. Pruebas físicas obligatorias (REQ-QA-02)

- Video A/V: `docs/pruebas/etapa6-video-fisico.md`
- Accesibilidad móvil: `docs/pruebas/etapa10-accesibilidad-manual.md`  
  **Firma QA física:** pendiente (LF-02).

---

## 9. Matriz de trazabilidad e informe de cumplimiento

Actualizada: `docs/trazabilidad.md` (estados Etapas 1–10).

**Cobertura modular (resumen):**

| Módulo         | Estado documentación           |
| -------------- | ------------------------------ |
| Autoevaluación | `docs` + tests dominio + e2e   |
| Profesionales  | `docs/recommendation-rules.md` |
| Schedule       | `docs/scheduling.md`           |
| Video          | `docs/video.md`                |
| Billing        | `docs/billing.md`              |
| Admin          | `docs/admin.md`                |
| Lanzamiento    | este documento                 |

---

## 10. Hallazgos e issues

Registro: `docs/issues/launch-findings.md`  
Plantilla GitHub: `.github/ISSUE_TEMPLATE/compliance-finding.md`

**Críticos abiertos:** ninguno.

---

## Lista de control — firmas

| Control                                    | Producto | Seguridad | Accesibilidad      |
| ------------------------------------------ | -------- | --------- | ------------------ |
| E2E smoke 6 navegadores/viewports          | ☐        | ☐         | ☐                  |
| axe sin serious/critical (Chromium/WebKit) | ☐        | ☐         | ☑ responsable axe |
| VoiceOver/TalkBack flujos críticos         | ☐        | ☐         | ☐                  |
| Textos y ética (sin Lorem/alarmismo)       | ☐        | ☐         | ☐                  |
| Staging sandbox + seed anonimizado         | ☐        | ☑        | ☐                  |
| Privacidad coherente                       | ☐        | ☑        | ☐                  |
| País inactivo hasta revisión legal         | ☐        | ☑        | ☐                  |
| Backup verificado ≤ 90 días                | ☐        | ☐         | ☐                  |
| Runbook incidentes revisado                | ☐        | ☑        | ☐                  |
| 0 hallazgos críticos                       | ☐        | ☐         | ☐                  |

**Instrucción:** reemplazar ☐ por iniciales y fecha (`JV 2025-11-20`) al aprobar.

---

## Comandos de validación rápida

```bash
pnpm test
pnpm build
pnpm test:e2e:launch
node tools/load/booking-spike.mjs http://localhost:3000 25 120
```

**CI:** `ci.yml` + `e2e.yml` en GitHub Actions.
