# Registro de hallazgos — lanzamiento (Etapa 10)

**Política:** ningún hallazgo **crítico** abierto al firmar `docs/lanzamiento.md`. Demás severidades → issue GitHub con plantilla `compliance-finding`.

| ID    | REQ         | Severidad | Estado  | Notas                                                                                                |
| ----- | ----------- | --------- | ------- | ---------------------------------------------------------------------------------------------------- |
| LF-01 | REQ-SEC-06  | Medio     | Abierto | Borrado autogestionado de cuenta: proceso vía soporte; automatizar en fase posterior                 |
| LF-02 | REQ-QA-02   | Medio     | Abierto | Firma física iOS/Android A/V pendiente de responsable QA (ver `docs/pruebas/etapa6-video-fisico.md`) |
| LF-03 | REQ-ARCH-01 | Bajo      | Abierto | PWA instalable: manifest/service worker no publicado                                                 |
| LF-04 | REQ-QA-01   | Bajo      | Cerrado | E2E con DB (reserva completa) cableada con flags `E2E_*`; smoke automatizado en CI                   |

Crear issue GitHub copiando filas abiertas con enlace a esta tabla.
