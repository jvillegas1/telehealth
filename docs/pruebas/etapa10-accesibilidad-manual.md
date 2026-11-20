# Prueba manual — lectores de pantalla (REQ-UX-02, REQ-QA-01)

Complementa `e2e/a11y-flows.spec.ts` (axe). Registrar resultados en `docs/lanzamiento.md`.

## VoiceOver (iOS Safari — paciente)

| Paso | Ruta                | Verificar                                             |
| ---- | ------------------- | ----------------------------------------------------- |
| 1    | `/`                 | H1 anunciado; enlaces de navegación en orden lógico   |
| 2    | `/autoevaluacion`   | Texto orientativo leído; botones con nombre accesible |
| 3    | `/privacidad`       | Listas y avisos distinguibles                         |
| 4    | `/citas` (logueado) | Estados de carga no bloquean foco                     |

## TalkBack (Android Chrome — paciente)

| Paso | Ruta                           | Verificar                                         |
| ---- | ------------------------------ | ------------------------------------------------- |
| 1    | `/profesionales`               | Filtros alcanzables por teclado virtual + explore |
| 2    | `/profesionales/[id]/reservar` | Checkbox política asociado a etiqueta             |
| 3    | `/sesion/[id]/espera`          | Botón deshabilitado anuncia espera de ventana     |

## VoiceOver / NVDA (escritorio — profesional)

| Paso | Ruta                   | Verificar                                |
| ---- | ---------------------- | ---------------------------------------- |
| 1    | `/ingreso`             | Formulario: error de validación asociado |
| 2    | `/profesional/citas`   | Acciones aceptar/rechazar identificables |
| 3    | `/sesion/[id]/control` | Panel herramientas sin trampas de foco   |

## Criterio

- Sin bloqueadores de WCAG AA en flujos críticos.
- Hallazgos → issue con plantilla `compliance-finding` y REQ asociado.
