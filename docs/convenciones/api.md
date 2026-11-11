# Convenciones de la API

## Rutas

- REST orientado a recursos, sustantivos en plural y en inglés, bajo `/api/v1`.
- Subrecursos cuando hay pertenencia clara: `/api/v1/restaurants/{id}/products`.
- Acciones que no son CRUD como subrecurso con verbo: `POST /api/v1/orders/{id}/cancel`.
- Rutas en kebab-case; JSON en camelCase.
- La verificación del sistema queda fuera de la versión: `GET /api/health`.

## Métodos y respuestas

| Operación   | Método          | Respuesta                           |
| ----------- | --------------- | ----------------------------------- |
| Listar      | `GET`           | `200` con la lista o la página      |
| Obtener uno | `GET`           | `200`                               |
| Crear       | `POST`          | `201` + header `Location` + recurso |
| Modificar   | `PUT` / `PATCH` | `200` con el recurso actualizado    |
| Eliminar    | `DELETE`        | `204`                               |

## Errores

Todas las respuestas de error usan Problem Details ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457))
con un campo `code` estable que el frontend puede usar para decidir qué mostrar.

| Estado | Cuándo                                                                         | `code`                                            |
| ------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| `400`  | El request no cumple el formato (Bean Validation)                              | `validation_failed`                               |
| `401`  | No hay sesión, venció o el login no es válido                                  | `unauthenticated`, `identity.invalid_credentials` |
| `403`  | Hay sesión pero el rol no alcanza, el recurso es de otro o falta el token CSRF | `access_denied`, el del dominio, `csrf_invalid`   |
| `404`  | El recurso no existe (`NotFoundException`)                                     | `<modulo>.not_found`                              |
| `409`  | Conflicto con el estado actual (por ejemplo, un pedido ya entregado)           | el del dominio                                    |
| `422`  | Se rompe una regla del negocio (`DomainException`)                             | el del dominio                                    |

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Datos inválidos",
  "instance": "/api/v1/restaurants",
  "code": "validation_failed",
  "errors": [{ "field": "name", "message": "must not be blank" }]
}
```

## Autenticación

La sesión es una cookie `SESSION` (`HttpOnly`, `SameSite=Lax`) que vence a los 30 minutos sin
actividad ([ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md)). El frontend nunca ve ni
guarda credenciales.

| Operación      | Ruta                         | Acceso     | Respuesta                                     |
| -------------- | ---------------------------- | ---------- | --------------------------------------------- |
| Registrarse    | `POST /api/v1/auth/register` | Público    | `201` + `Location: /api/v1/auth/me` + usuario |
| Iniciar sesión | `POST /api/v1/auth/login`    | Público    | `200` + usuario                               |
| Cerrar sesión  | `POST /api/v1/auth/logout`   | Con sesión | `204`                                         |
| Usuario actual | `GET /api/v1/auth/me`        | Con sesión | `200` + usuario                               |

```json
{ "id": 7, "name": "Ana Rojas", "email": "ana@correo.com", "role": "CUSTOMER" }
```

- El registro recibe nombre, correo, contraseña y rol, y acepta los roles `CUSTOMER` y `OWNER`. Las
  cuentas `ADMIN` solo se crean por configuración.
- Un login fallido responde lo mismo si el correo no existe que si la contraseña no coincide: `401`
  con `identity.invalid_credentials`. Una cuenta suspendida recibe `403` con
  `identity.account_suspended`, y un correo ya registrado, `409` con `identity.email_taken`.
- Toda petición que modifica (`POST`, `PUT`, `PATCH`, `DELETE`), incluidos el registro y el login,
  lleva el header `X-XSRF-TOKEN` con el valor de la cookie `XSRF-TOKEN`. El `HttpClient` de Angular
  lo hace solo.
- Cada endpoint declara quién lo puede usar. `GET /api/health` y las rutas de registro e inicio de
  sesión son públicas.

## Paginación

Las listas que pueden crecer se paginan con `?page=0&size=20` y responden:

```json
{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }
```

## Datos

- Fechas en ISO-8601 y UTC: `"2026-10-14T21:30:00Z"`.
- Dinero como número con dos decimales en bolivianos: `"price": 45.00`.
- El total de un pedido lo calcula el backend. El frontend puede mostrar un subtotal estimado del
  carrito, pero el valor que vale es el que devuelve la API al crear el pedido.
