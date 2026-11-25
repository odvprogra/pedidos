# 0015. Los cambios de los pedidos llegan en vivo con Server-Sent Events

- **Estado:** Propuesta
- **Fecha:** 2026-11-25

## Contexto

El dueño ve un pedido nuevo recién cuando aprieta "Actualizar", y el cliente ve que su pedido fue
aceptado o está listo recién cuando recarga el detalle. En un local con la cocina llena, un pedido
puede esperar minutos sin que nadie lo vea, y el cliente no sabe cuándo ir a retirarlo
([hacia-produccion.md](../hacia-produccion.md#2-pedidos-en-vivo)).

La información va en una sola dirección: del servidor al navegador. Las acciones (aceptar, rechazar,
cancelar) ya son `POST` con su permiso y su regla, y no cambian. La sesión es una cookie
([ADR-0008](0008-autenticacion-con-sesion-y-roles.md)) y los permisos se exigen con
`@PreAuthorize` en el controller.

## Decisión

Vamos a enviar los cambios con Server-Sent Events, con `SseEmitter` de Spring MVC.

- Cada caso de uso que crea o cambia un pedido publica un `OrderChange` (id del pedido, restaurante,
  cliente y estado) por el puerto `OrderChangePublisher` del dominio de `order`, después de
  guardarlo. Su adaptador lo pasa al `ApplicationEventPublisher` de Spring.
- `OrderChangeStreams`, en `order.infrastructure.live`, guarda las conexiones abiertas por
  restaurante y por cliente, y escucha el evento con
  `@TransactionalEventListener(phase = AFTER_COMMIT)`: un cambio que se deshace nunca se anuncia.
- Dos canales: `GET /api/v1/restaurants/mine/orders/events` (rol `OWNER`, los pedidos de su
  restaurante) y `GET /api/v1/orders/events` (rol `CUSTOMER`, sus pedidos). Cada mensaje es
  `event: order` con `{"orderId": 42, "status": "ACCEPTED"}`.
- El mensaje no lleva el pedido. El frontend lo vuelve a pedir por la API de siempre, con la misma
  autorización y la misma forma de los datos.
- No se guardan eventos para repetirlos. Al conectarse o reconectarse, el frontend recarga lo que
  muestra.
- Cada 25 segundos se envía un comentario para que los proxies no corten la conexión por
  inactividad y para descubrir las conexiones muertas. Una conexión dura hasta 30 minutos; después el
  navegador se reconecta solo.

Las conexiones viven en la memoria de la instancia. Con más de una instancia del backend, el
adaptador pasa a repartir el evento con `LISTEN/NOTIFY` de PostgreSQL, sin cambiar el puerto ni los
canales.

## Alternativas consideradas

- **WebSocket con STOMP:** sirve cuando el navegador también manda mensajes seguidos (un chat, la
  ubicación de un repartidor). Aquí no los manda, y habría que autenticar el handshake y autorizar
  cada suscripción aparte de `@PreAuthorize`, sumar `spring-boot-starter-websocket` y un cliente
  STOMP en el frontend. Si llega el envío con repartidores, se revisa esta decisión.
- **Consultar cada N segundos (polling):** no necesita nada nuevo, pero el retraso es de N segundos
  y cada pestaña abierta hace una consulta paginada cada N segundos aunque no haya cambios.
- **Mandar el pedido completo en el evento:** ahorra una petición, pero duplica la forma de
  `OrderResponse` en otro canal y obliga a pensar qué ve cada destinatario. Volver a pedirlo es una
  consulta por cambio, y los cambios son pocos.

## Consecuencias

- **Positivas:** el dueño y el cliente ven los cambios en menos de un segundo. El canal es HTTP
  común: viaja con la cookie de sesión, pasa por `SecurityConfig` y se prueba con `MockMvc`. No hay
  dependencias nuevas. El dominio solo conoce un puerto, así que los casos de uso se prueban con un
  fake que registra lo publicado.
- **Negativas:** cada pestaña abierta mantiene una conexión. Un proxy delante del backend tiene que
  desactivar el buffering en esas rutas. Los eventos que pasan mientras el navegador está
  desconectado se pierden, y por eso el frontend recarga al reconectarse. Mientras haya una sola
  instancia, escalar horizontalmente exige primero el paso a `LISTEN/NOTIFY`.
