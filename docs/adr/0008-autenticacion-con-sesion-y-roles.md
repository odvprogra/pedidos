# 0008. Autenticación con cookie de sesión y un rol por cuenta

- **Estado:** Aceptada
- **Fecha:** 2026-11-04

## Contexto

Clientes, dueños de restaurante y un administrador usan la misma aplicación con permisos distintos.
El administrador modera: suspende restaurantes y cuentas, y una cuenta suspendida tiene que perder
su sesión en la próxima petición. Es el proyecto de una materia de testing, así que importa que el
comportamiento sea correcto y fácil de probar en cada capa, más que sumar infraestructura. El
frontend llama al backend por el proxy `/api` desde el mismo origen
([ADR-0003](0003-stack-base.md)), y el dominio no puede depender de Spring
([ADR-0002](0002-arquitectura-hexagonal-por-modulos.md)). Hoy el proyecto no tiene Spring Security.

## Decisión

Vamos a autenticar con la sesión de Spring Security, guardada en PostgreSQL, y una cookie
`HttpOnly`.

- **Cuentas.** Cada cuenta tiene un rol fijo: `CUSTOMER`, `OWNER` o `ADMIN`. Se ingresa con correo
  (único y sin distinguir mayúsculas) y contraseña. El registro público crea clientes y dueños, sin
  confirmación por correo ni recuperación de contraseña, y deja la sesión iniciada. El primer admin
  se crea al arrancar con `ADMIN_EMAIL` y `ADMIN_PASSWORD`, si todavía no existe. Un dueño tiene un
  solo restaurante, y el restaurante guarda el id de su dueño. El admin suspende y reactiva cuentas
  de clientes y dueños, nunca de otro admin. Los campos de la cuenta se cierran en la ADR del
  modelo de datos.
- **Sesión.** Spring Session JDBC guarda las sesiones indexadas por el id de la cuenta, y suspender
  una cuenta borra todas sus sesiones. La cookie `SESSION` es `HttpOnly` y `SameSite=Lax`, y vence
  a los 30 minutos sin actividad. El CSRF se resuelve con `csrf.spa()`: el `HttpClient` de Angular
  devuelve la cookie `XSRF-TOKEN` en el header `X-XSRF-TOKEN` sin código propio. Las rutas son
  `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout` y
  `GET /api/v1/auth/me`.
- **Contraseñas.** Se guardan con BCrypt a través de `DelegatingPasswordEncoder`. Miden entre 8
  caracteres y 72 bytes (el límite de BCrypt), sin reglas de composición. La regla vive en el
  dominio de `identity`.
- **Ubicación.** `identity` tiene las cuentas, el registro, el login (un caso de uso que verifica la
  contraseña con el puerto `PasswordHasher`), la suspensión (puerto `AccountSessions`) y
  `AuthController`. En `shared.infrastructure.security` están `SecurityConfig`, el principal
  `CurrentUser` (id y rol), las respuestas 401 y 403 con Problem Details y todo lo que toca el
  contexto de seguridad o las sesiones. En el frontend, `core/auth` tiene `SessionStore`, los
  guards y el interceptor del 401.
- **Permisos.** `SecurityConfig` solo enumera las rutas públicas, entre ellas `/api/health`; el
  resto exige sesión. Cada endpoint declara su rol con `@PreAuthorize`. El controller recibe
  `@AuthenticationPrincipal CurrentUser` y pasa el id en el command, y el caso de uso valida que el
  recurso sea de ese usuario.
- **Verificación.** Se suman tres reglas de ArchUnit: `application` no depende de Spring Security;
  `@PreAuthorize` solo aparece en `infrastructure.web`; y el contexto de seguridad y las sesiones
  solo se tocan en `shared.infrastructure.security`. Cada endpoint protegido se prueba en
  `@WebMvcTest` sin sesión (401), con el rol incorrecto (403) y con el correcto. Un
  `@SpringBootTest` con Testcontainers recorre el flujo real: registro, `/me`, logout y suspensión.

El detalle está en [arquitectura.md](../arquitectura.md), [api.md](../convenciones/api.md) y
[testing.md](../convenciones/testing.md).

## Alternativas consideradas

- **JWT firmado por el backend:** no necesita CSRF, pero no se puede revocar. Cortar la sesión de
  una cuenta suspendida obligaría a consultar la base en cada petición, y habría que sumar refresh
  tokens y guardar el token en Angular. Si el token va en una cookie `HttpOnly`, vuelve a necesitar
  CSRF y sigue sin poder revocarse.
- **Keycloak u otro proveedor OIDC:** trae registro, suspensión y consola de administración, pero
  suma un servicio, pantallas de login ajenas a nuestro diseño y tests de integración más pesados.
  Además, el equipo no implementaría la autenticación.
- **Sesiones en memoria:** una dependencia menos, pero las sesiones se pierden al reiniciar y cortar
  las de una cuenta exige configurar un `SessionRegistry` a mano.
- **Roles por patrón de URL en `SecurityConfig`:** obliga a agrupar las rutas por rol en lugar de
  por recurso, y el controller no muestra quién puede usar cada endpoint.

## Consecuencias

- **Positivas:** cerrar sesión y suspender una cuenta tienen efecto inmediato. Angular no guarda
  credenciales. La pertenencia se prueba con fakes, sin Spring, y los permisos de cada endpoint en
  el slice web. Las sesiones sobreviven a un reinicio del backend.
- **Negativas:** con la primera feature de `identity` entran `spring-boot-starter-security`,
  `spring-boot-starter-session-jdbc` y `spring-boot-starter-security-test`, además de dos tablas de
  Spring Session que pasan a las migraciones cuando llegue Flyway. Cada petición lee la sesión de la
  base. En producción, el frontend y la API tienen que servirse desde el mismo dominio. Si el CSRF
  queda mal configurado, todo `POST` responde 403. No hay límite de intentos de login ni
  recuperación de contraseña. Una app móvil necesitaría tokens.
