# 0003. Stack base

- **Estado:** Aceptada
- **Fecha:** 2026-10-14

## Contexto

El curso pide una aplicación web con backend y frontend separados. El equipo conoce Java y
TypeScript, y necesita levantar el entorno igual en cualquier máquina.

## Decisión

Vamos a usar:

| Capa          | Tecnología                                                         |
| ------------- | ------------------------------------------------------------------ |
| Backend       | Spring Boot 4.1, Java 21, Spring Data JPA, Bean Validation, Lombok |
| Frontend      | Angular 21 (standalone, señales, zoneless), TypeScript estricto    |
| Base de datos | PostgreSQL 17                                                      |
| Entorno local | Docker Compose para la base; Maven Wrapper y npm para el resto     |
| Tests         | JUnit 6, AssertJ, Testcontainers, ArchUnit, Vitest                 |

En desarrollo el frontend llama al backend a través del proxy de Angular (`/api`), sin CORS.

Mientras el modelo de datos se diseña, Hibernate genera el esquema (`ddl-auto: update`). Antes de la
primera entrega se pasa a migraciones versionadas con Flyway y `ddl-auto: validate`, con una ADR
propia.

## Alternativas consideradas

- **Java 25:** es la LTS más reciente, pero no todos en el equipo la tienen instalada; Java 21 sigue
  siendo LTS y compila igual.
- **H2 para tests:** más rápido, pero no se comporta como PostgreSQL. Testcontainers usa la misma
  base que producción.
- **Flyway desde el primer día:** obliga a escribir migraciones mientras el modelo todavía cambia
  todos los días.

## Consecuencias

- **Positivas:** versiones actuales y con soporte; el entorno se levanta con tres comandos.
- **Negativas:** los tests de integración necesitan Docker encendido. Con `ddl-auto: update` el
  esquema puede quedar con columnas viejas; se arregla borrando el volumen
  (`docker compose down -v`) hasta que entre Flyway.
