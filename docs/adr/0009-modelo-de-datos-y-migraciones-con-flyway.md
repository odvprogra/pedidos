# 0009. Modelo de datos por módulo y migraciones con Flyway

- **Estado:** Aceptada
- **Fecha:** 2026-11-04

## Contexto

Todavía no hay tablas de negocio. [ADR-0003](0003-stack-base.md) dejó que Hibernate generara el
esquema mientras el modelo se diseñaba y anticipó el paso a Flyway con `ddl-auto: validate` antes de
la primera entrega. [ADR-0008](0008-autenticacion-con-sesion-y-roles.md) fijó la cuenta (correo
único, hash BCrypt, rol fijo, suspensión), un restaurante por dueño y dejó los campos para esta
decisión. [arquitectura.md](../arquitectura.md) pide que un módulo no toque la base de otro. Es el
proyecto de una materia de testing: el modelo tiene que ser lo más simple que sea correcto y fácil
de probar en cada capa.

## Decisión

Vamos a definir el modelo por módulo y a crear el esquema solo con migraciones de Flyway. El detalle
de cada tabla y regla está en [modelo-de-datos.md](../modelo-de-datos.md).

- **Tablas por módulo.** `identity` tiene `accounts` y las dos tablas de Spring Session;
  `restaurant`, `restaurants`; `catalog`, `categories` y `products`; `order`, `orders` y
  `order_items`.
- **Referencias.** Dentro de un módulo hay claves foráneas. Entre módulos solo hay una columna
  `xxx_id` con índice, sin clave foránea ni relación JPA; que el id exista lo garantiza el caso de
  uso, porque sale de la sesión o de un puerto hacia el otro módulo. La regla 4 de
  `ArchitectureTest` ya impide una relación JPA entre módulos.
- **Cuenta.** Nombre, correo guardado en minúsculas con `unique`, hash, rol con `check`, `suspended`
  y fecha de alta.
- **Restaurante.** Dos estados independientes: `open`, que maneja el dueño, y `suspended`, que
  maneja el admin. Recibe pedidos solo si está abierto y no suspendido. Empieza cerrado,
  suspenderlo lo cierra y lo oculta, y sus pedidos en curso se pueden terminar.
- **Carrito y pedido.** El carrito vive en el frontend; el pedido nace al confirmar. El backend usa
  los precios actuales, rechaza productos agotados o de otro restaurante, y copia el nombre del
  restaurante, el nombre y el precio de cada producto y el total. Así nada de lo que pase después en
  el catálogo cambia un pedido confirmado.
- **Estados del pedido.** `PLACED` → `ACCEPTED` → `READY` → `PICKED_UP`. Mientras está en `PLACED`,
  el dueño lo puede rechazar (`REJECTED`) y el cliente cancelar (`CANCELLED`). Cualquier otra
  transición responde `409`.
- **Flyway.** Entran `spring-boot-starter-flyway` y `flyway-database-postgresql` (Flyway 12.4, del
  BOM de Spring Boot 4.1.1), `ddl-auto: validate` y `spring.flyway.validate-migration-naming: true`.
  Las migraciones se llaman `V<n>__<descripcion>.sql`, con el número libre siguiente. Cada feature
  trae la migración de sus tablas, las de Spring Session entran con la primera de `identity`, y una
  migración aplicada no se edita.
- **Verificación.** Todo test con Testcontainers aplica las migraciones sobre un PostgreSQL vacío.
  `contextLoads` falla si una entidad no coincide con su tabla, y los tests `@DataJpaTest` de cada
  adaptador prueban las restricciones que sostienen una regla del negocio.
- **Imágenes.** Quedan para su ADR. Son opcionales, así que entran como una columna nullable sin
  cambiar el resto del modelo.

## Alternativas consideradas

- **Claves foráneas entre módulos:** la base garantizaría la integridad, pero cada test de
  persistencia tendría que crear filas de otros módulos, y el esquema ataría módulos que el código
  mantiene separados.
- **Carrito guardado en el backend:** sobrevive entre dispositivos, pero suma una tabla, endpoints y
  reglas para algo que el pedido resuelve al confirmar.
- **Ítems que apuntan al producto vivo:** sin copias, pero editar o borrar un producto cambiaría el
  detalle y el total de pedidos viejos.
- **Un solo estado `CANCELLED` con quién canceló:** una columna más para decir lo que dicen dos
  estados.
- **Suspender al dueño suspende su restaurante:** evita un local sin atender, pero acopla `identity`
  con `restaurant` y obliga a decidir qué pasa al reactivar.
- **Versiones con fecha (`V20261104__...`):** evitan que dos ramas tomen el mismo número, pero
  necesitan `outOfOrder` y se leen peor. Con pocas ramas a la vez alcanza el número correlativo.
- **Seguir con `ddl-auto: update` hasta la entrega:** Hibernate no crea los `check` ni los índices
  únicos que queremos, y el esquema de la entrega no se probaría nunca.

## Consecuencias

- **Positivas:** el esquema es el mismo en desarrollo, tests, CI y la entrega, y cada cambio es un
  archivo que se revisa en el PR. Los tests de persistencia corren contra el SQL real y cada módulo
  arma sus datos sin tocar los de otro. La máquina de estados y el total se prueban en el dominio,
  sin base. Un pedido confirmado no cambia.
- **Negativas:** cada tabla lleva una migración y una entidad que tienen que coincidir, y `validate`
  solo revisa tablas, columnas y tipos: los `check`, los únicos y los nulos se prueban aparte. Sin
  claves foráneas entre módulos, un error en un caso de uso puede guardar un id inexistente. Dos
  ramas pueden tomar el mismo número de migración, y la segunda en entrar la renumera. El pedido
  duplica datos del catálogo. Un dueño suspendido deja su restaurante sin atender hasta que el admin
  lo suspenda también. Una base local con tablas creadas por Hibernate se borra con
  `docker compose down -v`.
