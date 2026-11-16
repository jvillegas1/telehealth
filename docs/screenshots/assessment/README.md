# Capturas — autoevaluación

Generar con Playwright (móvil 360×800 y escritorio 1280×800):

1. Bienvenida  
2. Motivo  
3. Síntomas  
4. Contexto  
5. Objetivos  
6. Resultado orientativo  
7. Consentimiento al elegir profesional  

Estados: cargando, error del bot, sesión retomada, riesgo detectado.

Comando sugerido (cuando `E2E_ASSESSMENT=1`):

```bash
pnpm --filter @telehealth/web exec playwright test e2e/assessment-resume.spec.ts --project=chromium
```