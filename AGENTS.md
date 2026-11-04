# Pedidos

Plataforma de pedidos de comida al estilo PedidosYa, sin envío ni pagos: los restaurantes se
registran y publican su catálogo, y los clientes arman y confirman pedidos. Proyecto de Taller V
(NUR).

Este archivo es el contexto para asistentes de IA (Claude Code, Copilot, Cursor y otros). Las reglas
completas están en `docs/`; aquí está lo que hay que saber antes de tocar código.

## Stack

| Capa          | Tecnología                                                         |
| ------------- | ------------------------------------------------------------------ |
| Backend       | Spring Boot 4.1, Java 21, Spring Data JPA, Bean Validation, Lombok |
| Frontend      | Angular 21 (standalone, señales, zoneless), Tailwind CSS 4         |
| Base de datos | PostgreSQL 17 en Docker                                            |
| Tests         | JUnit 6, AssertJ, Testcontainers, ArchUnit, Vitest                 |

## Comandos

| Qué                       | Dónde       | Comando                                    |
| ------------------------- | ----------- | ------------------------------------------ |
| Levantar la base de datos | raíz        | `docker compose up -d`                     |
| Levantar el backend       | `backend/`  | `./mvnw spring-boot:run`                   |
| Formatear Java            | `backend/`  | `./mvnw spotless:apply`                    |
| Verificar el backend      | `backend/`  | `./mvnw verify` (formato, ArchUnit, tests) |
| Levantar el frontend      | `frontend/` | `npm start` (http://localhost:4200)        |
| Formatear                 | `frontend/` | `npm run format`                           |
| Lint                      | `frontend/` | `npm run lint`                             |
| Tests                     | `frontend/` | `npm test -- --watch=false`                |
| Build                     | `frontend/` | `npm run build`                            |

En Windows con PowerShell se usa `.\mvnw.cmd`. Los tests del backend necesitan Docker encendido.

## Arquitectura

- **Backend:** monolito modular con arquitectura hexagonal dentro de cada módulo
  (`domain` → `application` → `infrastructure`). El dominio es Java puro; JPA y los controllers son
  adaptadores. Un caso de uso por clase. Las reglas las verifica `ArchitectureTest`.
- **Frontend:** una carpeta por feature en `src/app/features/`; una feature nunca importa de otra.
  Lo compartido va a `shared/ui` o `core`. Las reglas las verifica ESLint.

Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Reglas que no se negocian

1. **Sin comentarios en el código**, ni Javadoc ni JSDoc. Si algo necesita explicación, se renombra
   o se extrae. El código no debe parecer generado.
2. **Código en inglés; documentación y textos de la interfaz en español.** Términos fijos:
   restaurante `restaurant`, catálogo `catalog`, producto `product`, pedido `order`, cliente
   `customer`, dueño `owner`.
3. **El modelo de datos todavía se está diseñando.** Si una tarea necesita una entidad, campo o
   relación que no existe, propón el modelo y espera confirmación antes de crearlo.
4. **No se desactiva ninguna verificación** (`@Disabled`, `it.skip`, `eslint-disable`,
   `@SuppressWarnings`, bajar una regla de ArchUnit) para que algo pase. Si una regla estorba, se
   discute y se cambia con una ADR.
5. **No se agregan dependencias** sin explicar por qué; si es una decisión relevante, con ADR.
6. **Dinero en `BigDecimal`**, fechas en `Instant` (UTC), IDs `Long`.
7. **Toda vista con datos** cubre cargando, vacío, error y éxito.
8. **Antes de dar algo por terminado**, se corre la verificación del lado que se tocó.
9. **Commits en Conventional Commits**, en inglés: `feat(backend): add restaurant registration`.
   Nunca en `main` directamente, nunca `--no-verify`.

## Documentación

| Tema                          | Archivo                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Arquitectura                  | [docs/arquitectura.md](docs/arquitectura.md)                   |
| Convenciones del backend      | [docs/convenciones/backend.md](docs/convenciones/backend.md)   |
| Convenciones del frontend     | [docs/convenciones/frontend.md](docs/convenciones/frontend.md) |
| Diseño de la API              | [docs/convenciones/api.md](docs/convenciones/api.md)           |
| Tests                         | [docs/convenciones/testing.md](docs/convenciones/testing.md)   |
| Git, PRs y Definition of Done | [docs/convenciones/git.md](docs/convenciones/git.md)           |
| Decisiones (ADRs)             | [docs/adr/README.md](docs/adr/README.md)                       |

## Flujo de trabajo

1. Entender la historia: criterios de aceptación, datos y preguntas abiertas.
2. Implementar siguiendo los ejemplos de `.claude/skills/backend-feature/reference.md` y
   `.claude/skills/frontend-feature/reference.md`.
3. Tests en la capa correcta.
4. Verificar.
5. Revisar arquitectura y UI antes del pull request.
6. Commits y pull request con la plantilla de `.github/pull_request_template.md`.
