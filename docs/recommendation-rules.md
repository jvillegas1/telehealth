# Reglas de recomendación de profesionales (REQ-MOD-02)

Motor **determinístico** en `packages/domain/src/professionals/recommendation/`. Sin modelos opacos.

## Visibilidad (REQ 7.2)

Un profesional aparece en el directorio solo si:

- `professional_profiles.status = approved`
- Existe al menos una fila en `credentials` con `status = verified`

Función: `isProfessionallyListed()` (`visibility.ts`).

## Mapeo autoevaluación → especialidades

Tabla en `ASSESSMENT_TAG_TO_SPECIALTIES` (`tag-map.ts`). Ejemplos:

| Etiqueta (`perfilProfesionalSugerido`) | Especialidades |
|---------------------------------------|----------------|
| escucha activa | acompanamiento-emocional, psicologia-clinica |
| enfoque contextual | terapia-cognitivo-conductual, psicologia-clinica |
| mindfulness | mindfulness, ansiedad-y-estres |

## Puntuación (`score.ts`)

| Regla | Puntos | Texto en UI |
|-------|--------|-------------|
| Cada especialidad coincidente | +3 c/u | Coincide con tu orientación: … |
| Idioma compartido con paciente | +2 | Atiende en un idioma que indicaste |
| Mismo país | +1 | Trabaja en tu país |
| Disponibilidad ≤ 7 días | +1 | Tiene disponibilidad en los próximos 7 días |

Orden: score descendente; empate por `displayName` (locale `es`).

Sin intake: se aplican solo país y disponibilidad (`rankProfessionalsWithoutIntake`).

## Tests

- `packages/domain/src/professionals/__tests__/visibility.test.ts`
- `packages/domain/src/professionals/__tests__/recommendation.cases.test.ts`
- `apps/web/src/server/professionals/list-guard.test.ts`

## Lighthouse (móvil 4G)

```bash
npx pnpm@9.15.0 --filter @telehealth/web dev
# En otra terminal:
npx lighthouse http://localhost:3000/profesionales --only-categories=performance --preset=desktop --throttling-method=simulate
```

Objetivo: performance ≥ 85 con listado de 12 tarjetas, imágenes lazy y Server Components.