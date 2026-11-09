# Convenciones de la API

## Rutas

- REST orientado a recursos, sustantivos en plural y en inglés, bajo `/api/v1`.
- Subrecursos cuando hay pertenencia clara: `/api/v1/restaurants/{id}/products`.
- Acciones que no son CRUD como subrecurso con verbo: `POST /api/v1/orders/{id}/cancel`.
- Rutas en kebab-case; JSON en camelCase.
- La verificación del sistema queda fuera de la versión: `GET /api/health`.

## Métodos y respuestas

| Operación   | Método          | Respuesta                             |
| ----------- | --------------- | ------------------------------------- |
| Listar      | `GET`           | `200` con la lista o la página        |
| Obtener uno | `GET`           | `200`                                 |
| Crear       | `POST`          | `201` + header `Location` + recurso   |
| Modificar   | `PUT` / `PATCH` | `200` con el recurso actualizado      |
| Eliminar    | `DELETE`        | `204`                                 |
| Acción      | `POST`          | `204`, o `200` si devuelve el recurso |

## Errores

Todas las respuestas de error usan Problem Details ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457))
con un campo `code` estable que el frontend puede usar para decidir qué mostrar.

| Estado | Cuándo                                                                           | `code`                                                |
| ------ | -------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `400`  | El request no cumple el formato (Bean Validation, JSON o un id que no es número) | `validation_failed`                                   |
| `401`  | No hay sesión, venció o el login no es válido                                    | `unauthenticated`, `identity.invalid_credentials`     |
| `403`  | Hay sesión pero el rol no alcanza, el recurso es de otro o falta el token CSRF   | `access_denied`, el del dominio, `csrf_invalid`       |
| `404`  | El recurso no existe (`NotFoundException`)                                       | `<modulo>.not_found` o `<modulo>.<recurso>_not_found` |
| `409`  | Conflicto con el estado actual (por ejemplo, un pedido ya entregado)             | el del dominio                                        |
| `422`  | Se rompe una regla del negocio (`DomainException`)                               | el del dominio                                        |

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

- El registro recibe nombre, correo, contraseña y rol, y acepta los roles `CUSTOMER` y `OWNER`; otro
  rol responde `400`. Las cuentas `ADMIN` solo se crean por configuración.
- Las reglas de la cuenta responden `422`: correo sin formato válido (`identity.invalid_email`),
  contraseña de menos de 8 caracteres (`identity.password_too_short`) o de más de 72 bytes
  (`identity.password_too_long`). El correo se valida después de quitarle los espacios.
- Un login fallido responde lo mismo si el correo no existe que si la contraseña no coincide: `401`
  con `identity.invalid_credentials`. En los dos casos se compara una contraseña con BCrypt, así que
  también tarda lo mismo. Una cuenta suspendida recibe `403` con
  `identity.account_suspended` solo si la contraseña es correcta, y un correo ya registrado, `409`
  con `identity.email_taken`.
- Registrarse o iniciar sesión con una sesión abierta la reemplaza por una nueva.
- Cerrar sesión sin sesión responde `401` con `unauthenticated`.
- Toda petición que modifica (`POST`, `PUT`, `PATCH`, `DELETE`), incluidos el registro y el login,
  lleva el header `X-XSRF-TOKEN` con el valor de la cookie `XSRF-TOKEN`. El `HttpClient` de Angular
  lo hace solo. La primera respuesta del backend, aunque sea un `401`, ya trae esa cookie, así que
  basta con que la app pida `/api/v1/auth/me` al arrancar.
- Cada endpoint declara quién lo puede usar. `GET /api/health`, las rutas de registro e inicio de
  sesión y los `GET` de [restaurantes y menús públicos](#restaurantes-y-menús-públicos) son
  públicos.

## Cuentas

El admin ve todas las cuentas y suspende o reactiva las de clientes y dueños. La cuenta del admin la
crea el backend al arrancar, con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (ver la configuración en el
`README.md`).

| Operación        | Ruta                                    | Acceso | Respuesta          |
| ---------------- | --------------------------------------- | ------ | ------------------ |
| Listar cuentas   | `GET /api/v1/accounts?page=0&size=20`   | Admin  | `200` + una página |
| Suspender cuenta | `POST /api/v1/accounts/{id}/suspend`    | Admin  | `204`              |
| Reactivar cuenta | `POST /api/v1/accounts/{id}/reactivate` | Admin  | `204`              |

```json
{
  "items": [
    { "id": 1, "name": "Administrador", "email": "admin@pedidos.com", "role": "ADMIN", "suspended": false },
    { "id": 7, "name": "Ana Rojas", "email": "ana@correo.com", "role": "CUSTOMER", "suspended": true }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 2,
  "totalPages": 1
}
```

- La lista trae todas las cuentas, también las de los admins, en orden de registro (por `id`
  ascendente). Una cuenta nueva cae en la última página, así que las anteriores no se corren.
- Cada cuenta trae id, nombre, correo, rol y si está suspendida. Nunca la contraseña.

- Suspender borra todas las sesiones de la cuenta. La próxima petición con cualquiera de ellas
  responde `401` con `unauthenticated`, y el login, `403` con `identity.account_suspended`.
- Una cuenta de administrador no se suspende, tampoco la propia: `422` con
  `identity.admin_not_suspendable`, y sus sesiones siguen abiertas.
- Un id que no existe responde `404` con `identity.not_found`.
- Las dos acciones son idempotentes: suspender una cuenta suspendida o reactivar una activa responde
  `204` y deja la cuenta como estaba.

## Restaurante del dueño

Cada dueño registra un solo restaurante y lo maneja desde `/mine`. El restaurante sale siempre de la
sesión, así que un dueño nunca ve ni cambia el de otro.

| Operación        | Ruta                                  | Acceso | Respuesta                                                 |
| ---------------- | ------------------------------------- | ------ | --------------------------------------------------------- |
| Registrar        | `POST /api/v1/restaurants`            | Dueño  | `201` + `Location: /api/v1/restaurants/mine` + el recurso |
| Ver el propio    | `GET /api/v1/restaurants/mine`        | Dueño  | `200` + el recurso                                        |
| Abrir el propio  | `POST /api/v1/restaurants/mine/open`  | Dueño  | `204`                                                     |
| Cerrar el propio | `POST /api/v1/restaurants/mine/close` | Dueño  | `204`                                                     |

```json
{
  "id": 4,
  "name": "La Casona",
  "description": "Comida criolla",
  "address": "Calle Sucre 245",
  "open": false,
  "suspended": false
}
```

- El registro recibe `name` (hasta 120 caracteres), `description` (opcional, hasta 300) y `address`
  (hasta 200). Un nombre o una dirección en blanco, o un campo más largo, responde `400` con
  `validation_failed` y el campo en `errors[].field`. Los tres se guardan sin espacios a los
  costados, y una descripción vacía queda en `null`.
- Un restaurante nuevo empieza cerrado y sin suspender. Un segundo registro del mismo dueño responde
  `409` con `restaurant.already_registered`.
- Si el dueño todavía no registró su restaurante, `GET`, `open` y `close` responden `404` con
  `restaurant.not_found`. El frontend usa ese código para mostrar el formulario de registro.
- Abrir y cerrar son idempotentes: abrir uno abierto o cerrar uno cerrado responde `204` y lo deja
  como estaba.
- Un restaurante suspendido no se abre: `409` con `restaurant.suspended`. Cerrarlo sí responde
  `204`. El dueño lo sigue viendo en `/mine`, con `suspended: true`.

## Menú del dueño

El dueño arma el menú de su restaurante con categorías y productos. Como en `/mine`, el restaurante
sale siempre de la sesión.

| Operación               | Ruta                                                         | Acceso | Respuesta                         |
| ----------------------- | ------------------------------------------------------------ | ------ | --------------------------------- |
| Ver el menú propio      | `GET /api/v1/restaurants/mine/catalog`                       | Dueño  | `200` + el menú                   |
| Crear una categoría     | `POST /api/v1/restaurants/mine/categories`                   | Dueño  | `201` + `Location` + la categoría |
| Renombrar una categoría | `PUT /api/v1/restaurants/mine/categories/{id}`               | Dueño  | `200` + la categoría              |
| Borrar una categoría    | `DELETE /api/v1/restaurants/mine/categories/{id}`            | Dueño  | `204`                             |
| Crear un producto       | `POST /api/v1/restaurants/mine/products`                     | Dueño  | `201` + `Location` + el producto  |
| Editar un producto      | `PUT /api/v1/restaurants/mine/products/{id}`                 | Dueño  | `200` + el producto               |
| Borrar un producto      | `DELETE /api/v1/restaurants/mine/products/{id}`              | Dueño  | `204`                             |
| Marcar agotado          | `POST /api/v1/restaurants/mine/products/{id}/mark-sold-out`  | Dueño  | `204`                             |
| Marcar disponible       | `POST /api/v1/restaurants/mine/products/{id}/mark-available` | Dueño  | `204`                             |

```json
{
  "categories": [
    {
      "id": 3,
      "name": "Platos fuertes",
      "products": [
        {
          "id": 10,
          "categoryId": 3,
          "name": "Silpancho",
          "description": "Con arroz y huevo",
          "price": 45.00,
          "available": true
        }
      ]
    },
    { "id": 5, "name": "Bebidas", "products": [] }
  ]
}
```

- El menú trae las categorías en el orden en que se crearon, cada una con sus productos también en
  orden de creación. No se pagina: un menú tiene un tamaño acotado y se muestra entero.
- Crear y renombrar una categoría reciben `{"name": "Bebidas"}`, hasta 60 caracteres. Crear y editar
  un producto reciben `categoryId`, `name` (hasta 120), `description` (opcional, hasta 300) y
  `price` (mayor que 0, con hasta 10 dígitos enteros y 2 decimales). Si un campo falta o no cumple,
  responde `400` con `validation_failed` y el campo en `errors[].field`. Los textos se guardan sin
  espacios a los costados, una descripción vacía queda en `null` y el precio vuelve con dos
  decimales (`45` se guarda como `45.00`).
- Un nombre de categoría que el restaurante ya usa, sin distinguir mayúsculas, responde `409` con
  `catalog.category_name_taken`. Cambiar solo las mayúsculas del propio nombre sí se puede, y otro
  restaurante puede usar el mismo nombre.
- Una categoría con productos no se borra, aunque estén agotados: `409` con
  `catalog.category_not_empty`. Primero se mueven o se borran sus productos.
- Un producto nuevo está disponible. Editar reemplaza la categoría, el nombre, la descripción y el
  precio, y no cambia si está agotado. Marcar agotado o disponible es idempotente.
- El `Location` de una categoría o un producto creado (`/mine/categories/{id}`,
  `/mine/products/{id}`) es la ruta donde se edita y se borra; no tiene `GET`, porque el menú se lee
  entero en `/mine/catalog`.
- Un id que no existe responde `404` con `catalog.category_not_found` o `catalog.product_not_found`.
  Una categoría o un producto de otro restaurante, también el `categoryId` del body, responde `403`
  con `catalog.not_owner`.
- Si el dueño todavía no registró su restaurante, todas responden `404` con `restaurant.not_found`,
  igual que `/mine`.
- El menú se edita igual con el restaurante abierto, cerrado o suspendido. Un cambio de precio solo
  afecta a los pedidos que se confirmen después.

## Restaurantes y menús públicos

Cualquiera, con o sin sesión, explora los restaurantes y lee sus menús. Solo son públicas para
`GET`; registrar un restaurante y todo lo que está bajo `/mine` sigue exigiendo sesión.

| Operación                | Ruta                                     | Acceso  | Respuesta          |
| ------------------------ | ---------------------------------------- | ------- | ------------------ |
| Listar restaurantes      | `GET /api/v1/restaurants?page=0&size=20` | Público | `200` + una página |
| Ver un restaurante       | `GET /api/v1/restaurants/{id}`           | Público | `200` + el recurso |
| Ver el menú de uno       | `GET /api/v1/restaurants/{id}/catalog`   | Público | `200` + el menú    |

```json
{
  "items": [
    {
      "id": 4,
      "name": "La Casona",
      "description": "Comida criolla",
      "address": "Calle Sucre 245",
      "open": true
    }
  ],
  "page": 0,
  "size": 20,
  "totalItems": 1,
  "totalPages": 1
}
```

- El listado trae solo los restaurantes visibles, los que no están suspendidos. Primero los
  abiertos y después los cerrados, y dentro de cada grupo en orden de registro (por `id`
  ascendente). Un restaurante que abre o cierra cambia de lugar en la lista.
- El listado y el detalle traen `id`, `name`, `description`, `address` y `open`. No traen
  `suspended`, que en público siempre sería `false`, ni el dueño.
- Un restaurante recién registrado ya aparece, cerrado y con el menú vacío: la visibilidad depende
  solo de la suspensión.
- El menú tiene la misma forma que el del dueño (`/mine/catalog`), en el mismo orden y con los
  productos agotados en su lugar con `available: false`. Las categorías sin productos no aparecen,
  así que un menú sin productos responde `{"categories": []}`. Un restaurante cerrado muestra su
  menú igual.
- Un restaurante suspendido o un id que no existe responden lo mismo en el detalle y en el menú:
  `404` con `restaurant.not_found` y el mensaje neutro "No encontramos el restaurante". Así no se
  distingue un local suspendido de uno que no existe. Un id que no es número responde `400` con
  `validation_failed`.
- En `SecurityConfig`, `/api/v1/restaurants/mine/**` se declara antes que las rutas públicas, porque
  `/api/v1/restaurants/*` y `/*/catalog` también coincidirían con `/mine` y `/mine/catalog`.

## Pedidos

El cliente confirma el carrito y el pedido queda pendiente en el restaurante. No hay envío ni pago:
lo retira en el local. Después sigue sus pedidos y puede cancelar uno mientras está pendiente.

| Operación           | Ruta                                | Acceso  | Respuesta                                           |
| ------------------- | ----------------------------------- | ------- | --------------------------------------------------- |
| Confirmar un pedido | `POST /api/v1/orders`               | Cliente | `201` + `Location: /api/v1/orders/{id}` + el pedido |
| Listar los propios  | `GET /api/v1/orders?page=0&size=20` | Cliente | `200` + una página de pedidos                       |
| Ver uno propio      | `GET /api/v1/orders/{id}`           | Cliente | `200` + el pedido                                   |
| Cancelar uno propio | `POST /api/v1/orders/{id}/cancel`   | Cliente | `200` + el pedido cancelado                         |

```json
{ "restaurantId": 4, "items": [{ "productId": 10, "quantity": 2 }, { "productId": 12, "quantity": 1 }] }
```

```json
{
  "id": 42,
  "restaurantId": 4,
  "restaurantName": "La Casona",
  "status": "PLACED",
  "total": 100.50,
  "placedAt": "2026-11-08T15:00:00Z",
  "updatedAt": "2026-11-08T15:00:00Z",
  "items": [
    { "productId": 10, "productName": "Silpancho", "unitPrice": 45.00, "quantity": 2, "subtotal": 90.00 },
    { "productId": 12, "productName": "Limonada", "unitPrice": 10.50, "quantity": 1, "subtotal": 10.50 }
  ]
}
```

- El body trae el restaurante y, por cada producto, su id y la cantidad. Cualquier otro campo, como un
  precio, un total o un cliente, se ignora: los precios salen del menú y el cliente, de la sesión.
- Si falta `restaurantId` o `items`, si un ítem es `null` o le falta `productId` o `quantity`,
  responde `400` con `validation_failed` y el campo en `errors[].field` (`items[0].quantity`). Un
  valor que no es número también responde `400`.
- Las reglas del pedido responden `422` con el código de
  [modelo-de-datos.md](../modelo-de-datos.md#confirmar-un-pedido): `order.empty`,
  `order.invalid_quantity`, `order.duplicate_product`, `order.restaurant_unavailable` y
  `order.product_unavailable`. Una lista vacía o una cantidad fuera de 1 a 99 son reglas del pedido,
  no del formato. Se revisan en ese orden y responde la primera que falla; ante cualquiera, no se
  guarda nada.
- Un restaurante que no existe, está suspendido o está cerrado responde lo mismo,
  `order.restaurant_unavailable`, y un producto que no existe, es de otro restaurante o está agotado,
  `order.product_unavailable`. El mensaje no dice cuál de los casos fue.
- El pedido nace en `PLACED`, con `placedAt` y `updatedAt` iguales y en UTC. Cada línea copia el
  nombre y el precio que el producto tiene al confirmar, y `subtotal` y `total` los calcula el
  backend.
- Un dueño o un admin reciben `403` con `access_denied` en todas las rutas de esta tabla. El
  `Location` apunta a `GET /api/v1/orders/{id}`.

### Historial del cliente

- La lista trae solo los pedidos del cliente de la sesión, con sus ítems y la misma forma que el
  pedido de arriba. Van los más nuevos primero (por `placedAt` descendente y, si coinciden, por `id`
  descendente), así un pedido recién confirmado aparece arriba de la primera página.
- `updatedAt` es la hora del último cambio de estado; mientras el pedido está pendiente, es igual a
  `placedAt`.
- Ver o cancelar un pedido que no existe responde `404` con `order.not_found`; uno de otro cliente,
  `403` con `order.not_owner`. Se revisa en ese orden, y recién después el estado: un pedido aceptado
  de otro cliente responde `403`, no `409`. Un id que no es número responde `400` con
  `validation_failed` y el campo `id`.
- Cancelar solo se puede con el pedido en `PLACED`. En cualquier otro estado, también si ya estaba
  cancelado, responde `409` con `order.invalid_transition` y el pedido no cambia. Los nombres y las
  transiciones de cada estado están en
  [modelo-de-datos.md](../modelo-de-datos.md#estados).
- Cancelar responde `200` con el pedido actualizado, no `204`: así la interfaz muestra el estado y la
  hora que guardó el backend sin calcularlos. La interfaz oculta "Cancelar pedido" cuando el estado
  ya no lo permite, pero quien decide es el backend.

## Paginación

Las listas que pueden crecer se paginan con `?page=0&size=20` y responden:

```json
{ "items": [], "page": 0, "size": 20, "totalItems": 0, "totalPages": 0 }
```

- `page` empieza en 0 y va hasta 1.000.000; por defecto es 0. `size` va de 1 a 100; por defecto
  es 20. Fuera de esos límites, o con un valor que no es número, responde `400` con
  `validation_failed` y el parámetro en `errors[].field`. El valor no se recorta en silencio.
- Una página después de la última responde `200` con `items` vacío y los totales reales, no `404`.
- Cada lista paginada documenta su orden, y el orden es estable: dos pedidos iguales devuelven lo
  mismo en el mismo orden.
- En el backend, el puerto devuelve un `PageResult` (`shared.domain.model`) y el controller responde
  con `PageResponse.from(...)` (`shared.infrastructure.web`). En el frontend, la forma es `Page<T>`
  (`core/http`).

## Datos

- Fechas en ISO-8601 y UTC: `"2026-10-14T21:30:00Z"`.
- Dinero como número con dos decimales en bolivianos: `"price": 45.00`.
- El total de un pedido lo calcula el backend. El frontend puede mostrar un subtotal estimado del
  carrito, pero el valor que vale es el que devuelve la API al crear el pedido.
