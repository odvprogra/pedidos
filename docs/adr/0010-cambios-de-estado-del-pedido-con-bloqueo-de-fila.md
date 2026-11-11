# 0010. Los cambios de estado de un pedido bloquean su fila

- **Estado:** Propuesta
- **Fecha:** 2026-11-09

## Contexto

Un pedido cambia de estado por dos personas distintas: el cliente lo cancela y el dueño lo acepta,
lo rechaza, lo marca listo y lo entrega. Cada caso de uso lee el pedido, le pide a `Order` la
transición y lo guarda. Si el cliente cancela mientras el dueño acepta, los dos leen `PLACED`, los
dos aprueban la transición y el último en guardar pisa al primero: el dueño recibe `200` por un
pedido que termina cancelado, o al revés. La regla "una vez aceptado, ya no se cancela"
([modelo-de-datos.md](../modelo-de-datos.md#estados)) dejaría de cumplirse justo cuando importa.

`orders` no tiene columna de versión, y cualquier columna nueva necesita una migración y la
confirmación del modelo de datos ([ADR-0009](0009-modelo-de-datos-y-migraciones-con-flyway.md)).

## Decisión

Vamos a leer el pedido con un bloqueo de fila en cada caso de uso que cambia su estado. El puerto
`OrderRepository` tiene `findByIdForUpdate(id)`, y su adaptador usa un método de Spring Data con
`@Lock(LockModeType.PESSIMISTIC_WRITE)`, que en PostgreSQL es `select ... for no key update`. La
segunda transacción espera a que termine la primera, lee el estado nuevo y `Order` responde
`409` con `order.invalid_transition`. Las lecturas (`GET`) usan `findById`, sin bloqueo.

Se prueba con dos transacciones reales en `OrderLockingTest`: una toma la fila y espera, y la otra
tiene que quedar esperando hasta que la primera confirma. Sin el bloqueo, el test falla.

## Alternativas consideradas

- **Versión optimista (`@Version`):** también da `409`, pero suma una columna `version` a
  `orders`, una migración y un error distinto (`OptimisticLockException`) que habría que traducir
  a `order.invalid_transition`. Conviene cuando las transacciones son largas o hay mucha
  contención; acá son cortas y casi nunca chocan.
- **Update condicional (`update orders set status = ? where id = ? and status = ?`):** evita el
  bloqueo, pero saca la regla de transición del dominio y la repite en SQL, y el puerto pasaría a
  devolver si se actualizó en lugar de guardar el agregado.
- **No hacer nada:** el último en guardar gana. Es lo más simple, pero rompe una regla de negocio
  visible para el cliente y para el dueño.

## Consecuencias

- **Positivas:** la regla de transición sigue en `Order` y el resultado es el mismo que si los dos
  pedidos llegaran uno después del otro. No cambia el esquema. El comportamiento queda probado
  contra PostgreSQL real.
- **Negativas:** la segunda petición espera a la primera. El bloqueo no tiene tiempo límite, así que
  depende de que las transacciones de estos casos de uso sigan siendo cortas (una lectura y un
  guardado). `OrderLockingTest` usa hilos y un `CountDownLatch`, y es el único test del proyecto que
  depende de esperar medio segundo para comprobar que la segunda transacción está bloqueada.
