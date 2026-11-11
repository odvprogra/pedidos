# Pendientes

Lo que se sabe que falta o que quedó fuera a propósito. Lo que la rúbrica sí evalúa está en
[rubrica.md](rubrica.md).

## Decisiones por confirmar

Cinco ADR están en "Propuesta": el código ya las aplica y falta que el equipo las acepte.

| ADR                                                                       | Qué decide                                                   | Recomendación |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------- |
| [0010](adr/0010-cambios-de-estado-del-pedido-con-bloqueo-de-fila.md)      | Los cambios de estado de un pedido bloquean su fila          | Aceptar       |
| [0011](adr/0011-cambios-de-estado-del-restaurante-con-bloqueo-de-fila.md) | Los cambios de estado de un restaurante bloquean su fila     | Aceptar       |
| [0012](adr/0012-region-fija-para-anunciar.md)                             | Lo que se anuncia sin mover el foco va a una región fija     | Aceptar       |
| [0013](adr/0013-pruebas-e2e-con-playwright.md)                            | Las pruebas E2E usan Playwright desde una carpeta propia     | Aceptar       |
| [0014](adr/0014-imagenes-como-direcciones-web.md)                         | Las imágenes de restaurantes y productos son direcciones web | Aceptar       |

El índice `orders_restaurant_id_status_idx` sobre `(restaurant_id, status)` está propuesto en
[modelo-de-datos.md](modelo-de-datos.md) y no se creó. La recomendación es no crearlo todavía: con
el volumen de un proyecto de curso, `orders_restaurant_id_idx` alcanza. Si se crea, entra en una
migración nueva y reemplaza al de una columna.

## Limitaciones conocidas

- **Sin envío ni pagos.** El alcance termina cuando el restaurante entrega el pedido en el local
  (COMPLETADO).
- **Las imágenes son direcciones web.** El dueño pega un enlace; la app no sube ni guarda archivos.
  Si el sitio ajeno borra la imagen, se muestra el placeholder de la marca
  ([ADR-0014](adr/0014-imagenes-como-direcciones-web.md)).
- **El carrito vive en el navegador.** Se guarda en `localStorage`, no en la base: no se comparte
  entre dispositivos. El total del carrito es una estimación; el que vale es el que calcula el
  backend al confirmar, con los precios de ese momento.
- **Un restaurante por dueño**, con una sola categoría de cocina elegida de una lista fija.
- **Un solo administrador**, que el backend crea al arrancar con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
  No hay pantalla para crear otro ni para cambiar su contraseña.
- **Los estados cambian con una acción por paso** (`POST .../orders/{id}/accept`,
  `start-preparing`, `mark-ready`, `mark-picked-up`), no con el `PATCH /orders/{id}/status` que el
  enunciado da como ejemplo. Así cada paso tiene su permiso y su regla, y no se puede pedir un
  estado arbitrario. Detalle en [convenciones/api.md](convenciones/api.md).
- **Los nombres del código no son los del enunciado:** PENDIENTE es `PLACED` y COMPLETADO es
  `PICKED_UP`. La interfaz sí usa los del enunciado. La tabla completa está en
  [rubrica.md](rubrica.md#nombres-del-enunciado-y-nombres-del-código).
- **El dueño ve los pedidos nuevos al recargar la lista.** No hay notificaciones ni actualización en
  vivo.
- **No se recupera una contraseña olvidada** ni se edita el perfil de una cuenta.
- **Los E2E corren solo en Chrome**, de a uno, y cada corrida tarda unos minutos porque levanta el
  backend y el frontend.
- **`npm install` en `frontend/` se corre con Node 24 y npm 11.19.1**, las versiones de la CI. Con
  otra versión, npm puede reescribir el `package-lock.json` y dejarlo distinto del que la CI espera.

## Mejoras futuras

Quedaron analizadas y sin aplicar porque la rúbrica no las evalúa. Van en dos pull requests.

### Anuncios y panel del administrador (`fix/anuncios-y-panel`, unas 400 líneas)

- **Anuncios.** Tres páginas todavía tienen su propio `<p aria-live>`: el menú del restaurante, el
  carrito y los pedidos del dueño. Pasan a una pieza `AnnouncementSlot` en `shared/ui/live-region`,
  con la misma forma que `NoticeSlot` (anuncia, retira y se retira sola al destruirse), como pide la
  [ADR-0012](adr/0012-region-fija-para-anunciar.md). Sus specs pasan a leer
  `TestBed.inject(Announcer).shown()`. `app-pagination` también tiene un `aria-live` y queda como
  está.
- **Una fila que ya no existe.** Si el admin actúa sobre una cuenta o un restaurante que
  desapareció (`404`), el panel hoy muestra el error genérico. Debería avisar "No encontramos ese
  restaurante. Actualizamos la lista.", recargar la misma página y llevar el foco al título.
- **Página vacía.** Si la página pedida quedó vacía y no es la primera, pedir la última.
- **Esqueleto.** Que el esqueleto de carga use las mismas columnas que la tabla
  (`md:grid-cols-accounts`, `md:grid-cols-restaurants`), con el encabezado en un `<ng-template>`.
- **Píldora del total.** Mostrarla solo cuando hay al menos un elemento.

### Contraste de los botones mientras trabajan (`fix/contraste-botones`, unas 130 líneas)

Mientras un botón espera la respuesta se muestra con opacidad, y el texto queda por debajo del
4,5:1 que pide WCAG AA. Medido:

| Botón                          | Hoy                                   | Propuesta                                          |
| ------------------------------ | ------------------------------------- | -------------------------------------------------- |
| Principal (blanco sobre marca) | 3,26:1 con `opacity-70`               | Sin opacidad mientras trabaja: 4,86:1              |
| Secundario                     | Neutro 4,25, peligro 2,76, éxito 2,88 | Sin opacidad mientras trabaja                      |
| "Cerrar sesión" del encabezado | 2,97:1                                | `aria-disabled:bg-brand-strong` (6,52:1) y spinner |

Ninguna opacidad sobre el color de marca llega a 4,5:1 (con 0,9 da 4,37). La propuesta separa dos
casos con un input `working` en el botón: trabajando (cursor de espera, sin sombra, sin opacidad) y
bloqueado (`opacity-70`, `cursor-not-allowed`).

### Otras

- Subir las imágenes desde el formulario en lugar de pegar un enlace.
- Avisar al dueño cuando entra un pedido sin que recargue la lista.
- Correr los E2E también en Firefox y WebKit.
