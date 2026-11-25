# Hacia producción

Qué le falta a Pedidos para salir al mercado, en qué orden conviene hacerlo y qué se decidió en cada
punto. Parte del estado del 2026-11-25: la rúbrica está cubierta ([rubrica.md](rubrica.md)) y las
limitaciones conocidas están en [pendientes.md](pendientes.md).

Cada mejora entra con sus tests en la capa que corresponde, como el resto del proyecto. Las que
cambian el modelo de datos se proponen en [modelo-de-datos.md](modelo-de-datos.md) y esperan
confirmación antes de crear la migración (regla 3 de `AGENTS.md`). Las que cambian una decisión
tomada llevan su ADR.

## Resumen

| #   | Mejora                                     | Por qué importa                                                 | Fase |
| --- | ------------------------------------------ | --------------------------------------------------------------- | ---- |
| 1   | Imágenes subidas a la app                  | Seguridad, privacidad, rendimiento y SEO                        | 1    |
| 2   | Pedidos en vivo con Server-Sent Events     | El dueño y el cliente ven los cambios sin recargar              | 1    |
| 3   | Datos de contacto del cliente en el pedido | El local no sabe a quién entregarle el pedido #42               | 1    |
| 4   | Seguridad de las cuentas                   | Fuerza bruta, contraseñas olvidadas y correos falsos            | 1    |
| 5   | Despliegue y operación                     | Hoy no hay imagen Docker, HTTPS, logs, métricas ni respaldos    | 1    |
| 6   | Búsqueda y filtros                         | Con 200 restaurantes, 12 por página sin buscar no sirve         | 2    |
| 7   | SEO de las páginas públicas                | Los buscadores reciben un `<app-root>` vacío                    | 2    |
| 8   | Horarios y tiempos de preparación          | Hoy el dueño abre y cierra a mano                               | 2    |
| 9   | Paginación: ajustes donde ya existe        | Listas que cambian mientras se recorren y conteos caros         | 2    |
| 10  | Rendimiento de la API y del frontend       | Compresión, caché HTTP e índices pendientes                     | 2    |
| 11  | Legal y cuenta                             | Términos, privacidad, editar perfil y borrar la cuenta          | 2    |
| 12  | Crecimiento                                | Notificaciones push, reseñas, favoritos, reportes para el dueño | 3    |

**Fase 1** es lo mínimo para abrir a clientes reales. **Fase 2** es lo que hace que la quieran usar.
**Fase 3** viene después de tener usuarios. Pagos y envío siguen fuera del alcance.

## 1. Imágenes subidas a la app

**Hoy.** El dueño pega una dirección web y el navegador del cliente la pide al sitio ajeno
([ADR-0014](adr/0014-imagenes-como-direcciones-web.md)). `app-cover-image` usa `NgOptimizedImage`
sin un loader, así que no hay `srcset` ni tamaños.

**Problemas.**

- **SEO.** Google indexa las imágenes con el dominio donde están alojadas, no con el de Pedidos. Una
  foto de 4 MB pegada desde cualquier sitio empeora el LCP, que es parte del ranking.
- **Rendimiento.** No se controla el peso ni el formato. Una tarjeta de 160 px puede bajar una foto
  de 4000 px.
- **Privacidad.** Cada visita le manda la IP y el navegador del cliente a un servidor que eligió el
  dueño. Una imagen puede ser un píxel de seguimiento.
- **Moderación.** El admin aprueba lo que ve hoy; el dueño del otro sitio puede cambiar la imagen
  mañana por cualquier cosa.
- **Fragilidad.** Si el sitio borra la imagen, activa protección contra hotlinking o sirve por
  `http://` (contenido mixto bloqueado en un sitio `https`), se ve el placeholder.
- **CSP.** No se puede limitar `img-src` a orígenes propios mientras cualquier host sea válido.

**Decisión.** El dueño sube el archivo desde el formulario. El backend:

1. Acepta JPEG, PNG y WebP hasta 5 MB, y revisa los bytes iniciales del archivo, no solo el
   `Content-Type`.
2. Lo decodifica y lo vuelve a codificar en WebP en tres anchos (160, 640 y 1280 px). Recodificar
   descarta metadatos (la ubicación GPS de una foto de celular) y cualquier contenido incrustado.
3. Lo guarda en un almacenamiento de objetos compatible con S3 (MinIO en Docker para desarrollo y
   tests; Cloudflare R2 o S3 en producción) con un nombre que no se repite, y lo sirve detrás de un
   CDN con `Cache-Control: public, max-age=31536000, immutable`.
4. Guarda en la tabla la clave del objeto (`image_key`) en lugar de `image_url`. Cambiar la imagen
   crea una clave nueva, así que la caché nunca sirve la vieja.

El frontend pasa un loader propio a `NgOptimizedImage` para que arme el `srcset` con los tres
anchos, y marca `priority` en la imagen principal de la ficha del restaurante.

No se importa desde una dirección web en el backend: descargar una URL que eligió el usuario abre
la puerta a SSRF (pedir `http://169.254.169.254/` o servicios internos) y no aporta nada que subir
el archivo no resuelva.

**Cambios.** Migración que agrega `image_key` y elimina `image_url` (las URLs existentes se pierden;
en datos de prueba no importa). Puerto `ImageStorage` en `shared` con su adaptador S3. Nueva ADR que
reemplaza a la 0014. Dependencias nuevas: el SDK de S3 de AWS (sirve para MinIO y R2) y una librería
para escribir WebP, justificadas en la ADR.

**Tests.** Dominio: tipos y tamaños aceptados. Caso de uso con un `ImageStorage` en memoria.
Integración con MinIO en Testcontainers. Web: `413` para un archivo grande y `422` para uno que no
es imagen. E2E: el dueño sube el logo y el cliente lo ve.

## 2. Pedidos en vivo

**Hoy.** El dueño ve los pedidos nuevos cuando aprieta "Actualizar". El cliente ve el cambio de
estado cuando recarga el detalle. En un local con la cocina llena, un pedido puede esperar minutos
sin que nadie lo vea.

**Decisión: Server-Sent Events, no WebSocket.** Las dos tecnologías mantienen una conexión abierta,
pero aquí la información va en una sola dirección, del servidor al navegador: las acciones (aceptar,
rechazar) ya son `POST` normales. SSE es la opción más simple para eso:

- Es HTTP común: viaja con la cookie de sesión y pasa por el mismo `SecurityConfig` y los mismos
  `@PreAuthorize`. Con WebSocket habría que autenticar el handshake y autorizar cada suscripción
  STOMP aparte.
- `EventSource` se reconecta solo y manda `Last-Event-ID`.
- En Spring MVC es un `SseEmitter`; no hace falta WebFlux ni un broker.

WebSocket conviene cuando el cliente también manda mensajes seguidos (un chat, un repartidor que
envía su ubicación). Si eso llega con el envío, se revisa la decisión con otra ADR.

**Diseño.**

- Cada caso de uso que cambia un pedido publica un `OrderChanged` (id del pedido, restaurante,
  cliente y estado) por un puerto del dominio. El adaptador lo emite **después del commit**
  (`@TransactionalEventListener(phase = AFTER_COMMIT)`) para no avisar de un cambio que se deshizo.
- Dos canales: `GET /api/v1/restaurants/mine/orders/events` (rol `OWNER`, pedidos de su restaurante)
  y `GET /api/v1/orders/events` (rol `CUSTOMER`, sus pedidos).
- El evento lleva solo el id y el estado. El frontend vuelve a pedir el pedido por la API normal, así
  la autorización y la forma de los datos son las de siempre.
- Al reconectarse, el frontend recarga la lista: los eventos que pasaron mientras estaba desconectado
  no se guardan.
- Con más de una instancia del backend, el evento tiene que llegar a la instancia donde está
  conectado el navegador. Se usa `LISTEN/NOTIFY` de PostgreSQL, que ya está en el stack; no hace
  falta Redis.
- Se activan los hilos virtuales de Java 21 (`spring.threads.virtual.enabled: true`) para que cada
  conexión abierta no ocupe un hilo del servidor. El proxy tiene que desactivar el buffering en esas
  rutas.

**En la interfaz.**

- Dueño: el pedido nuevo aparece arriba de "En curso" con un sonido corto y la pestaña dice
  "(2) Pedidos" mientras haya pendientes. El botón "Actualizar" queda como respaldo.
- Cliente: el detalle y la lista cambian la insignia solos, y el cambio se anuncia en la región
  `role="status"` ([ADR-0012](adr/0012-region-fija-para-anunciar.md)).
- Si la conexión se corta, un aviso discreto "Reconectando…" en lugar de quedarse con datos viejos
  sin decirlo.

**Tests.** Caso de uso: publica el evento en cada transición válida y ninguno en una inválida.
Integración: el evento no sale si la transacción hace rollback. Web: el canal del dueño no entrega
pedidos de otro restaurante. E2E con dos contextos de Playwright: el cliente confirma, el dueño ve
el pedido sin recargar, lo acepta y el cliente ve "Aceptado" sin recargar.

## 3. Datos de contacto en el pedido

**Hoy.** La tarjeta del dueño muestra número, hora, ítems y total, pero no quién lo pidió. En el
mostrador, el local no puede confirmar a quién entrega ni llamar si un producto se agotó.

**Decisión.** Al confirmar, el pedido copia el nombre de la cuenta y un teléfono que el cliente
carga una vez en su perfil (obligatorio para pedir). También se agrega una nota opcional de hasta
200 caracteres ("sin cebolla") y un motivo al rechazar, elegido de una lista corta (sin stock,
cerrando, demasiados pedidos). Los tres están en "Fuera del modelo" en
[modelo-de-datos.md](modelo-de-datos.md) y necesitan migración.

## 4. Seguridad de las cuentas

| Falta                          | Decisión                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Límite de intentos de ingreso  | 5 intentos fallidos por correo en 15 minutos y límite por IP en el proxy. Responde `429` con `Retry-After`                       |
| Verificación del correo        | Correo con enlace al registrarse. Se puede explorar sin verificar, pero no confirmar un pedido ni registrar un restaurante       |
| Recuperar la contraseña        | Enlace de un solo uso que vence en 30 minutos. Cambiarla cierra las demás sesiones (ya existe el mecanismo en `AccountSessions`) |
| Contraseñas filtradas          | Rechazar las que aparecen en la lista de Have I Been Pwned (consulta por prefijo de hash, sin mandar la contraseña)              |
| Cabeceras de seguridad         | CSP estricta (posible recién después de la mejora 1), HSTS, `Referrer-Policy` y `Permissions-Policy`, en el proxy                |
| Cookie de sesión               | `secure: true` en producción sin depender de una variable que se puede olvidar, y prefijo `__Host-`                              |
| Registro de acciones del admin | Tabla de auditoría: quién suspendió qué y cuándo                                                                                 |
| Dependencias vulnerables       | Dependabot para Maven, npm y Actions                                                                                             |

El correo necesita un proveedor transaccional (Resend, Postmark o Amazon SES) detrás de un puerto
`Mailer`, con un adaptador en memoria para los tests y Mailpit en Docker para desarrollo.

## 5. Despliegue y operación

Hoy el proyecto corre en la máquina del desarrollador. Falta:

- **Imágenes Docker** del backend (JRE 21 sobre una base mínima, usuario sin privilegios) y del
  frontend (los archivos estáticos detrás de Caddy o Nginx, que también hace de proxy a la API y
  pone HTTPS).
- **Perfil `prod`** con la configuración que hoy tiene valores por defecto de desarrollo (base,
  cookie, admin inicial).
- **Salud y métricas:** Spring Boot Actuator con `liveness` y `readiness` para el orquestador y
  métricas en formato Prometheus. `/api/health` queda para la página de estado.
- **Logs** en JSON con un id por petición que también se devuelve en la respuesta de error, para
  encontrar en los logs el error que reporta un usuario.
- **Errores del frontend** enviados a un servicio de seguimiento (Sentry o similar) desde el
  `ErrorHandler` global.
- **Respaldos** de PostgreSQL diarios con restauración probada, o una base gestionada con
  recuperación a un punto en el tiempo.
- **Ambiente de staging** igual a producción, donde la CI despliega cada merge a `main` y corre los
  E2E contra él.
- **Fuente propia:** servir Plus Jakarta Sans desde la app en lugar de Google Fonts (una conexión
  menos en la primera carga y ningún dato del visitante a un tercero).

## 6. Búsqueda y filtros

**Hoy.** La lista pública muestra los restaurantes de 12 en 12, abiertos primero, sin buscar ni
filtrar. La categoría de cocina ya existe pero no se usa para filtrar.

**Decisión.**

- `GET /api/v1/restaurants?q=pollo&category=CHICKEN&open=true`: busca en el nombre del restaurante,
  su descripción y los nombres de sus productos, sin distinguir mayúsculas ni tildes.
- PostgreSQL alcanza: extensiones `unaccent` y `pg_trgm` con un índice GIN. No hace falta
  Elasticsearch hasta tener miles de restaurantes.
- En la interfaz: buscador arriba de la lista, chips por categoría y "Solo abiertos". Los filtros
  van en la URL (`/restaurantes?categoria=pizzas&q=muzza`) para que se puedan compartir y para que
  "Atrás" vuelva al mismo resultado.
- Como la búsqueda cruza `restaurant` y `catalog`, el índice de búsqueda vive en un módulo de
  lectura que se alimenta de eventos de ambos, para no romper la regla de que cada módulo es dueño
  de sus tablas. Se explica en una ADR.

## 7. SEO de las páginas públicas

**Hoy.** La app es una SPA sin renderizado en el servidor. El HTML que llega a un buscador o a
WhatsApp al compartir un enlace es el mismo para todas las rutas: `<title>Pedidos</title>` y un
`<app-root>` vacío. Un restaurante que no existe responde `200` (soft 404).

**Decisión.**

- `@angular/ssr` con hidratación, solo para `/restaurantes` y `/restaurantes/:id`. Las páginas con
  sesión siguen renderizándose en el navegador.
- URLs con nombre: `/restaurantes/12-la-casona`. El id manda; si el nombre no coincide, redirección
  `301` a la URL correcta.
- Por página: `title`, `meta description`, `link rel="canonical"` y Open Graph (nombre, descripción
  e imagen del local) para que el enlace se vea bien al compartirlo.
- Datos estructurados JSON-LD: `Restaurant` con dirección y `Menu` con sus productos y precios.
- `sitemap.xml` generado por el backend con los restaurantes visibles y `robots.txt` que excluye
  `/carrito`, `/pedidos`, `/mi-restaurante` y `/admin`.
- Restaurante inexistente o suspendido: el servidor responde `404` de verdad.
- Una portada propia en `/` (qué es Pedidos, categorías, restaurantes destacados) en lugar de la
  redirección a `/restaurantes`.

## 8. Horarios y tiempos de preparación

- **Horario semanal** por restaurante (varios tramos por día). El estado efectivo es "abierto" solo
  si el dueño lo tiene abierto y está dentro del horario. La lista muestra "Abre a las 18:00".
  Las horas se guardan en la zona del restaurante (`America/La_Paz`) y la regla usa el `Clock` que
  ya existe, así los tests fijan la hora.
- **Tiempo estimado:** el dueño elige al aceptar (15, 30 o 45 minutos) y el cliente ve "Listo
  aprox. a las 13:40".
- **Pausa rápida:** "No recibir pedidos por 30 minutos" para una hora pico, que vuelve sola.
- **Pedidos sin respuesta:** un pedido pendiente por más de 10 minutos se rechaza solo con el
  motivo "El restaurante no respondió", y el cliente se entera por el canal en vivo.

## 9. Paginación

La paginación ya existe en todas las listas que crecen (restaurantes públicos, pedidos del cliente,
del dueño y del admin, cuentas y restaurantes del admin), con `page` y `size` hasta 100. El menú de
un restaurante no se pagina y está bien así: es corto y se lee entero. Lo que falta ajustar:

- **"En curso" del dueño deja de paginarse.** Son los pedidos que la cocina tiene que ver todos a la
  vez y su cantidad está acotada por lo que el local puede preparar. Con pedidos en vivo, una lista
  paginada por desplazamiento corre los pedidos de página mientras el dueño la mira. Se muestra
  entera, agrupada en columnas por estado (Pendiente, Aceptado, En preparación, Listo). "Terminados"
  sigue paginada.
- **Paginación por cursor en el historial del admin.** `page=5000` obliga a la base a recorrer y
  descartar 100 000 filas, y el `count(*)` de la tabla entera se vuelve caro. Con un cursor
  (`?after=<placed_at,id>`) cada página cuesta lo mismo. La interfaz pasa a "Cargar más". Las listas
  del cliente y del dueño, acotadas a una persona o un local, pueden seguir por número de página.
- **Página fuera de rango:** si la página pedida quedó vacía y no es la primera, pedir la última
  (ya anotado en [pendientes.md](pendientes.md)).
- **Página en la URL** (`/restaurantes?pagina=3`) para que recargar o volver no lleve a la primera.

## 10. Rendimiento

- Compresión de respuestas (`server.compression.enabled` o en el proxy, con Brotli).
- `ETag` y `Cache-Control` corto en los endpoints públicos (lista y menú), para que el CDN y el
  navegador no repitan consultas que no cambiaron.
- Crear `orders_restaurant_id_status_idx` sobre `(restaurant_id, status)`: con pedidos reales, la
  lista "En curso" deja de recorrer todo el historial del local. Y un índice sobre
  `(placed_at desc, id desc)` para el cursor del admin.
- Medir antes de optimizar: una prueba de carga con k6 sobre confirmar pedido y la lista pública,
  con un objetivo escrito (por ejemplo, p95 menor a 300 ms con 200 usuarios a la vez).
- En el frontend, presupuestos de tamaño en `angular.json` más estrictos y Lighthouse en la CI
  sobre las páginas públicas.

## 11. Legal y cuenta

- Términos de uso y política de privacidad enlazados en el registro y en el pie de página, con la
  casilla de aceptación guardada con su fecha.
- Editar nombre, teléfono, correo (con verificación) y contraseña.
- Borrar la cuenta: se anonimiza el nombre y el teléfono en los pedidos pasados para que el
  restaurante conserve su historial sin datos personales.
- Más de un admin, creado por otro admin, con el registro de auditoría de la mejora 4.

La cookie de sesión es estrictamente necesaria, así que no hace falta un banner de cookies mientras
no se agreguen analíticas que usen cookies.

## 12. Crecimiento

Después de tener usuarios: app instalable (PWA) y notificaciones push para el dueño con la pestaña
cerrada, reseñas del cliente después de retirar el pedido, restaurantes favoritos, "Pedir de nuevo"
desde el historial, reportes para el dueño (ventas por día, productos más pedidos) y, recién
entonces, pagos en línea y envío.

## Orden de trabajo

Una rama y un pull request por punto, en este orden:

1. `feat/pedidos-en-vivo` (2). Es lo que más cambia la experiencia y no toca el modelo de datos.
2. `feat/contacto-en-pedido` (3). Pequeño y necesario para operar.
3. `feat/subir-imagenes` (1). Habilita la CSP estricta y el SEO de imágenes.
4. `feat/seguridad-de-cuentas` (4).
5. `chore/despliegue` (5).
6. `feat/busqueda` (6) y `feat/tablero-del-dueno` (9).
7. `feat/ssr-y-seo` (7).
8. `feat/horarios` (8), rendimiento (10) y legal (11).

Cada pull request deja la rúbrica intacta: los tests de [mapa-de-tests.md](mapa-de-tests.md) siguen
pasando y los nuevos se agregan al mapa.
