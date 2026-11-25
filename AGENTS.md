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
| Tests         | JUnit 6, AssertJ, Testcontainers, ArchUnit, Vitest, Playwright     |

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
| Tests E2E                 | `e2e/`      | `npm test` (levanta todo en 8090 y 4210)   |

En Windows con PowerShell se usa `.\mvnw.cmd`. Los tests del backend necesitan Docker encendido.

## Arquitectura

- **Backend:** monolito modular con arquitectura hexagonal dentro de cada módulo
  (`domain` → `application` → `infrastructure`). El dominio es Java puro; JPA y los controllers son
  adaptadores. Un caso de uso por clase. Las reglas las verifica `ArchitectureTest`.
- **Frontend:** una carpeta por feature en `src/app/features/`; una feature nunca importa de otra.
  Lo compartido va a `shared/ui` o `core`. Las reglas las verifica ESLint.
- **Autenticación:** cookie de sesión de Spring Security con las sesiones en PostgreSQL. Cada
  cuenta tiene un rol fijo (`CUSTOMER`, `OWNER` o `ADMIN`). El rol se exige con `@PreAuthorize` en
  el controller y la pertenencia la valida el caso de uso. Detalle en
  [ADR-0008](docs/adr/0008-autenticacion-con-sesion-y-roles.md).
- **Datos:** cada módulo es dueño de sus tablas; entre módulos solo se guardan ids, sin claves
  foráneas. El esquema lo crean las migraciones de Flyway, una por feature, y Hibernate solo lo
  valida. Detalle en [docs/modelo-de-datos.md](docs/modelo-de-datos.md) y
  [ADR-0009](docs/adr/0009-modelo-de-datos-y-migraciones-con-flyway.md).

Detalle en [docs/arquitectura.md](docs/arquitectura.md).

## Reglas que no se negocian

1. **Sin comentarios en el código**, ni Javadoc ni JSDoc. Si algo necesita explicación, se renombra
   o se extrae. El código no debe parecer generado.
2. **Código en inglés; documentación y textos de la interfaz en español.** Términos fijos:
   restaurante `restaurant`, catálogo `catalog`, producto `product`, pedido `order`, cliente
   `customer`, dueño `owner`, administrador `admin`, cuenta `account`.
3. **El modelo de datos está en [docs/modelo-de-datos.md](docs/modelo-de-datos.md).** Si una tarea
   necesita una tabla, campo o relación que no está ahí, propón el cambio y espera confirmación
   antes de crearlo. Cada tabla entra con una migración de Flyway, y una migración que ya está en
   `main` no se edita.
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
| Modelo de datos               | [docs/modelo-de-datos.md](docs/modelo-de-datos.md)             |
| Convenciones del backend      | [docs/convenciones/backend.md](docs/convenciones/backend.md)   |
| Convenciones del frontend     | [docs/convenciones/frontend.md](docs/convenciones/frontend.md) |
| Diseño de la API              | [docs/convenciones/api.md](docs/convenciones/api.md)           |
| Tests                         | [docs/convenciones/testing.md](docs/convenciones/testing.md)   |
| Git, PRs y Definition of Done | [docs/convenciones/git.md](docs/convenciones/git.md)           |
| Decisiones (ADRs)             | [docs/adr/README.md](docs/adr/README.md)                       |
| Rúbrica y sus tests           | [docs/rubrica.md](docs/rubrica.md)                             |
| Enlace a cada test            | [docs/mapa-de-tests.md](docs/mapa-de-tests.md)                 |
| Limitaciones y mejoras        | [docs/pendientes.md](docs/pendientes.md)                       |
| Plan para salir al mercado    | [docs/hacia-produccion.md](docs/hacia-produccion.md)           |

## Flujo de trabajo

1. Entender la historia: criterios de aceptación, datos y preguntas abiertas.
2. Implementar siguiendo los ejemplos de `.claude/skills/backend-feature/reference.md` y
   `.claude/skills/frontend-feature/reference.md`.
3. Tests en la capa correcta.
4. Verificar.
5. Revisar arquitectura y UI antes del pull request.
6. Commits y pull request con la plantilla de `.github/pull_request_template.md`.
