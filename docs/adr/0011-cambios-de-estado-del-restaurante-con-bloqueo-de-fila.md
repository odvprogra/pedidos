# 0011. Los cambios de estado de un restaurante bloquean su fila

- **Estado:** Propuesta
- **Fecha:** 2026-11-10

## Contexto

Un restaurante tiene dos estados que cambian dos personas distintas: el dueño lo abre o lo cierra, y
el admin lo suspende o lo reactiva. Cada caso de uso lee el restaurante, le pide el cambio a
`Restaurant` y lo guarda, y guardar escribe la fila entera. Si el dueño abre mientras el admin
suspende, los dos leen el restaurante cerrado y sin suspender, y el último en guardar pisa al
primero. El admin recibe `200` y ve "Suspendiste La Casona", pero el local queda abierto y visible.
La regla "mientras está suspendido, el dueño no lo puede abrir"
([modelo-de-datos.md](../modelo-de-datos.md#restaurant)) dejaría de cumplirse.

Es el mismo problema que resolvió [ADR-0010](0010-cambios-de-estado-del-pedido-con-bloqueo-de-fila.md)
para los pedidos. `restaurants` tampoco tiene columna de versión.

## Decisión

Vamos a leer el restaurante con un bloqueo de fila en los cuatro casos de uso que cambian su
estado, igual que en los pedidos. El puerto `RestaurantRepository` tiene `findByIdForUpdate(id)`,
que usan suspender y reactivar, y `findByOwnerIdForUpdate(ownerId)`, que usan abrir y cerrar. Su
adaptador usa métodos de Spring Data con `@Lock(LockModeType.PESSIMISTIC_WRITE)`. La segunda
transacción espera a que termine la primera y lee el estado nuevo: si el admin suspendió, abrir
responde `409` con `restaurant.suspended`; si el dueño abrió, suspender lo cierra igual. Las
lecturas (`/mine`, el listado y el detalle públicos, la lista del admin) no bloquean.

Se prueba con dos transacciones reales en `RestaurantLockingTest`, como `OrderLockingTest`. Sin el
bloqueo, los dos tests fallan.

## Alternativas consideradas

- **Versión optimista (`@Version`):** suma una columna `version` a `restaurants`, una migración y
  un error nuevo (`OptimisticLockException`) que el dueño o el admin tendrían que reintentar. Los
  cambios son cortos y casi nunca chocan, así que esperar es más simple que reintentar.
- **Guardar solo las columnas que cambiaron (`@DynamicUpdate`):** la suspensión ya no se pierde,
  pero el local puede quedar abierto y suspendido a la vez, y la regla depende de un detalle de
  Hibernate que no se ve en el caso de uso.
- **Dejarlo como limitación conocida:** el choque necesita que los dos toquen el mismo local en el
  mismo instante, pero si pasa, una suspensión confirmada se deshace sin aviso.

## Consecuencias

- **Positivas:** las reglas siguen en `Restaurant` y el resultado es el mismo que si los dos
  cambios llegaran uno después del otro. No cambia el esquema. Pedidos y restaurantes usan el mismo
  criterio, probado contra PostgreSQL real.
- **Negativas:** el segundo cambio espera al primero, sin tiempo límite, como en ADR-0010.
  `RestaurantLockingTest` suma cuatro tests que dependen de esperar medio segundo. Confirmar un
  pedido lee el restaurante sin bloqueo, así que un pedido que llega en el mismo instante que la
  suspensión puede quedar pendiente; el dueño lo termina como cualquier pedido en curso. Si
  ADR-0010 se rechaza, esta también hay que revisarla.
