# 0006. Las reglas se verifican con herramientas

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

Una convención que solo está escrita se rompe, sobre todo cuando parte del código lo genera una IA
que puede ignorar o malinterpretar un documento. Las revisiones humanas deberían enfocarse en el
negocio, no en el formato ni en qué capa importa a cuál.

## Decisión

Vamos a convertir en verificaciones automáticas todas las reglas que se puedan comprobar:

| Regla                               | Herramienta                       | Dónde corre                |
| ----------------------------------- | --------------------------------- | -------------------------- |
| Formato Java                        | Spotless + palantir-java-format   | `./mvnw verify`, CI        |
| Capas y dependencias del backend    | ArchUnit (`ArchitectureTest`)     | `./mvnw verify`, CI        |
| Reglas de Angular y accesibilidad   | angular-eslint                    | `npm run lint`, CI         |
| Límites entre carpetas del frontend | eslint-plugin-boundaries          | `npm run lint`, CI         |
| Formato TypeScript, HTML y CSS      | Prettier + plugin de Tailwind     | `npm run format:check`, CI |
| Formato de los commits              | commitlint (Conventional Commits) | hook `commit-msg`, CI      |

La CI (`.github/workflows/ci.yml`) corre todo en cada pull request. Ninguna regla se desactiva para
que algo pase; si una regla estorba, se cambia con una ADR.

## Alternativas consideradas

- **Checkstyle o PMD además de Spotless:** agregan muchas reglas de estilo que generan ruido; con
  formato automático y ArchUnit cubrimos lo importante.
- **google-java-format:** usa indentación de 2 espacios; palantir mantiene los 4 espacios habituales
  en Java y líneas de 120 columnas.
- **Solo revisiones manuales:** dependen de la memoria y el tiempo de quien revisa.

## Consecuencias

- **Positivas:** el formato nunca se discute; un asistente de IA recibe un error concreto cuando
  rompe una regla y puede corregirlo solo.
- **Negativas:** `./mvnw verify` tarda más (Testcontainers levanta PostgreSQL) y necesita Docker.
  Hay que correr `./mvnw spotless:apply` y `npm run format` antes de commitear.
