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

| Estado | Cuándo                                                               | `code`               |
| ------ | -------------------------------------------------------------------- | -------------------- |
| `400`  | El request no cumple el formato (Bean Validation)                    | `validation_failed`  |
| `401`  | No hay sesión                                                        |                      |
| `403`  | Hay sesión pero no tiene permiso                                     |                      |
| `404`  | El recurso no existe (`NotFoundException`)                           | `<modulo>.not_found` |
| `409`  | Conflicto con el estado actual (por ejemplo, un pedido ya entregado) | el del dominio       |
| `422`  | Se rompe una regla del negocio (`DomainException`)                   | el del dominio       |

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
