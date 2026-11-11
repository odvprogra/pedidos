# Convenciones del frontend

Complementa a [arquitectura.md](../arquitectura.md). El ejemplo completo de cada pieza está en
[.claude/skills/frontend-feature/reference.md](../../.claude/skills/frontend-feature/reference.md).

## Nombres

Se sigue la guía de estilo de Angular 2025: archivos sin sufijo de tipo para componentes.

| Pieza                    | Archivo                                              | Clase / export       |
| ------------------------ | ---------------------------------------------------- | -------------------- |
| Página (enrutada)        | `pages/restaurant-list-page/restaurant-list-page.ts` | `RestaurantListPage` |
| Componente               | `components/restaurant-card/restaurant-card.ts`      | `RestaurantCard`     |
| Cliente HTTP             | `data-access/restaurant-api.ts`                      | `RestaurantApi`      |
| Estado compartido        | `data-access/menu-store.ts`                          | `MenuStore`          |
| Lógica de varias páginas | `data-access/moderation-list.ts`                     | `ModerationList`     |
| Modelo                   | `models/restaurant.ts`                               | `Restaurant`         |
| Rutas de la feature      | `restaurants.routes.ts`                              | `RESTAURANTS_ROUTES` |
| Componente reutilizable  | `shared/ui/badge/badge.ts`                           | `Badge`              |

Selectores con prefijo `app-` en kebab-case. Las interfaces no llevan prefijo `I`.

## Componentes

- Standalone (por defecto) y siempre `changeDetection: ChangeDetectionStrategy.OnPush`.
- Template en archivo `.html` aparte. Sin archivo de estilos: los estilos van con Tailwind en el
  template.
- `input()`, `output()` y `model()`; nunca los decoradores `@Input` / `@Output`.
- `inject()` en lugar de inyección por constructor.
- Lo que solo usa el template es `protected`; las señales son `readonly`.
- Las páginas cargan datos y manejan estado. Los componentes de `components/` solo reciben inputs y
  emiten outputs; no inyectan servicios de datos.

## Estado y datos

- Estado local con `signal` y `computed`.
- Los clientes HTTP (`XxxApi`) devuelven `Observable` y no guardan estado.
- Toda suscripción de una página a un pedido HTTP se corta cuando la página se destruye: si la
  persona sale antes de la respuesta, el pedido se cancela y su respuesta no toca una página que ya
  no está (ni navega desde ella, como el ingreso). Si lo que se cortó ya había llegado al backend,
  como un registro, el cambio queda hecho: al volver, la página muestra cómo quedó. Se hace con
  `takeUntilDestroyed`; si la página además corta el pedido anterior al pedir otro (el detalle de un
  pedido, el menú público, los pedidos del dueño), guarda la `Subscription` y la cancela también en
  `DestroyRef.onDestroy`.
- El estado que comparten varias páginas de una feature va en un `XxxStore` (`@Injectable` con
  señales). Una librería de estado global (NgRx u otra) requiere una ADR.
- Todas las URLs usan `environment.apiUrl`.
- Toda vista con datos cubre cuatro estados: cargando, vacío, error y éxito. El error de carga es
  `app-load-error` (`@shared/ui`): recibe el título y el mensaje, emite `retry` al tocar
  "Reintentar", y la página le lleva el foco con su método `focus()`. Al reintentar, la página no
  vuelve al esqueleto: le pasa `[retrying]="true"` y el error queda a la vista, con el botón en
  "Reintentando…" (que también se anuncia), `aria-disabled` y el foco, que ignora más toques. Si
  llega la respuesta, el foco
  va al título; si vuelve a fallar, el motivo entra de nuevo como `role="alert"` y se anuncia. Solo
  "Reintentar" deja el error a la vista: cambiar de filtro o de página lo quita como antes. El vacío
  es `app-empty-state` (`@shared/ui`): recibe el título y el mensaje, el ícono va con el atributo
  `emptyStateIcon` y la acción, si la hay, como contenido.
- La carga es un esqueleto con la forma de lo que viene y un texto `sr-only` con `appAnnounce`
  (`<span class="sr-only" appAnnounce>Cargando tus pedidos…</span>`), que lo anuncia en la región
  fija mientras el esqueleto está a la vista. Cada barra es un `div appSkeleton` (`@shared/ui`), que
  pone el pulso, el color y la pausa con `motion-reduce`; la página le da el tamaño y la forma
  (`h-4 w-40 rounded`).
- Lo que hay que anunciar sin mover el foco se escribe en una sola región fija:
  `app-live-region` (`@shared/ui`), un `role="status"` `sr-only` que está vacío desde que arranca la
  app y va después del `<main>` en `app.html`. Una región que entra al DOM con el texto ya puesto no
  se anuncia en todos los lectores de pantalla; por eso el esqueleto y el aviso de éxito no llevan
  `role="status"`. La directiva `appAnnounce` (`@shared/ui`) escribe en la región el texto de su
  elemento cuando aparece y lo saca cuando se va (lee el texto una sola vez: un texto que cambia se
  anuncia con un elemento nuevo, como hace `NoticeSlot`); `Announcer` le da un id nuevo a cada
  anuncio, así un mismo mensaje se vuelve a anunciar. Un `app-alert` en `success` se anuncia solo, con
  `appAnnounce`, y no lleva rol; en `danger` y `warning` lleva `role="alert"`, que sí se anuncia al
  entrar. Los specs leen lo anunciado con `TestBed.inject(Announcer).shown()`. El código nuevo
  anuncia con `appAnnounce` o `Announcer`; las regiones `aria-live` de una página que ya existían (el
  carrito, el menú, "Actualizar" en los pedidos) están desde el principio y funcionan, pero quedan
  por pasar a la región fija. La decisión está en
  [ADR-0012](../adr/0012-region-fija-para-anunciar.md).
- Los errores del backend llegan como Problem Details. Si la feature conoce el `code`, muestra su
  propio mensaje en español, debajo del campo o en una alerta; si no lo conoce, muestra el `detail`.
  Los `errors[]` se asignan a los campos con `applyFieldErrors` (`@shared/utils`). Cuando no hay
  respuesta, `toProblemDetails` (`@core/http`) dice "No hay conexión. Revisa tu internet e intenta
  de nuevo."; cuando la respuesta no es un Problem Details, "Algo salió mal de nuestro lado. Intenta
  de nuevo en un momento.". Los textos de error hablan como la persona, sin palabras técnicas
  (servidor, operación, token, petición).
- Una lista paginada recibe un `Page<T>` (`@core/http/page`) y usa `app-pagination`
  (`@shared/ui`). La primera carga muestra el esqueleto; al cambiar de página, la lista anterior
  queda visible con `aria-busy` y la paginación deshabilitada hasta que llega la nueva. Cuando
  llega, el foco va al título de la página; si falla, a "Reintentar".
- Las listas del panel del admin (cuentas y restaurantes) comparten esa lógica, y la de suspender y
  reactivar, en `ModerationList` (`features/admin/data-access`). Es una clase con señales de solo
  lectura que la página crea en un campo, porque usa `inject()`, y a la que le pasa un
  `ModerationConfig`: cómo listar, cómo aplicar la acción, sus textos, sus errores y adónde va el
  foco. Se prueba sola con una configuración falsa; la página solo dibuja.
- Una acción que afecta a otra persona, como suspender una cuenta, o que no se puede deshacer, como
  borrar un producto del menú, se confirma dentro de la misma fila o tarjeta con `app-confirm-panel`
  (`@shared/ui`), sin modal: el foco va a "Cancelar" al abrir la pregunta, Escape la cierra y el
  foco vuelve al botón. Si la acción no se puede hacer, como borrar una categoría con productos, el
  mismo panel lo explica en tono de aviso y solo ofrece "Entendido". El botón "Cancelar" del panel
  puede decir lo que se mantiene ("Mantener pedido") cuando la acción misma se llama cancelar.
- En una página hay una sola pregunta abierta a la vez: abrir otra cierra la anterior. El
  componente de la fila expone `confirming` como `model()` y la pregunta abierta vive en un
  `ConfirmationSlot` (`@shared/ui`) de la página o de su `ModerationList`:
  `[confirming]="confirmation.isOpen(id)"` y `(confirmingChange)="confirmation.set(id, $event)"`. Si
  la página tiene preguntas de filas distintas, como productos y categorías en el menú del dueño, la
  clave las separa (`'product-' + id`, `'category-' + id`). Se cierra con `confirmation.close()`
  cuando la lista se vuelve a cargar y cuando se abre un formulario en el lugar, para que la pregunta
  no reaparezca al volver la fila.
- Los pasos que hacen avanzar un pedido por su camino normal (Aceptar, Empezar a preparar, Marcar listo,
  Entregar) no
  se confirman, aunque no se deshagan: son lo que el dueño hace decenas de veces al día. Sí se
  confirman los que lo cortan: Rechazar, para el dueño, y Cancelar pedido, para el cliente.
- Al confirmar, el panel se cierra y el botón que lo abrió dice qué está haciendo ("Cancelando…")
  con `aria-disabled` y el foco, hasta que llega la respuesta. Si el backend responde que el recurso
  ya cambió (`409`), se avisa en tono `warning` y se vuelve a pedir, para mostrar cómo está ahora.
- Un estado propio que se deshace con otro toque, como abrir o cerrar el restaurante o agotar un
  producto, es un interruptor (`role="switch"` con `aria-checked`) sin confirmación; mientras
  trabaja queda con `aria-disabled` y dice qué está haciendo.
- Elegir qué parte de una lista ver, como "En curso" o "Terminados" en los pedidos del dueño, son
  botones con `aria-pressed` dentro de un `role="group"` con nombre: un riel `bg-surface` con borde
  y el elegido en `bg-brand` con texto blanco. Cambiar de filtro vuelve a la primera página y lleva
  el foco al título, como cambiar de página.
- Las secciones de un panel, como Cuentas y Restaurantes en el del admin, se ven con el mismo riel,
  pero son enlaces dentro de un `nav` con nombre y la actual lleva `aria-current="page"`. Viven en
  una ruta contenedora con `<router-outlet>`, así la navegación no se repite y el enlace tocado no se
  destruye; la sección que se abre lleva el foco a su título cuando termina de cargar.
- Una lista que otros cambian mientras se mira, como los pedidos del dueño, tiene un botón
  "Actualizar" que la vuelve a pedir en la misma página y con el mismo filtro. No se consulta sola.
  Mientras trabaja dice "Actualizando…", el foco se queda en el botón y el resultado se anuncia en
  una región `aria-live="polite"` ("Lista actualizada: 4 pedidos en curso.").
- Un botón que hace un paso y deja en su lugar el botón del paso siguiente, como "Aceptar" y
  "Marcar listo", ignora el segundo clic de un doble clic (`MouseEvent.detail > 1`). Así un doble
  toque no hace dos pasos. Si el paso falla, el foco se queda en el botón que se tocó.
  Después de un paso, la tarjeta queda con el pedido que devolvió la API, aunque ya no corresponda
  al filtro, hasta la próxima carga: así no se pierden el foco ni lo que el dueño estaba mirando.
- El resultado de una acción se anuncia en un `app-sticky-notice` (`@shared/ui`), un aviso
  `app-alert dismissible` fijo bajo el header, en `tone="success"` (su texto se anuncia en la región
  fija y el aviso no lleva rol) o en `warning` o `danger` (`role="alert"`). Su atributo
  `data-sticky-notice` agranda el margen de scroll de la página para que el aviso no tape el
  elemento con el foco. El aviso de la página vive en un `NoticeSlot`
  (`notice.show(tone, message)` y `notice.clear()`), que le da un id nuevo a cada aviso. La página
  lo dibuja con `@for (shown of notice.shown(); track shown.id)`: así cada aviso es un nodo nuevo y
  un mismo mensaje repetido se vuelve a anunciar. Al cerrarlo con su "Cerrar aviso", el foco vuelve
  a donde estaba antes de llegar a ese botón, cuando el aviso ya se fue; si ese elemento ya no está,
  va al `h1` de la página, que por eso lleva siempre `tabindex="-1"`. Si el foco no estaba en el
  aviso, no se mueve.
- Un dato secundario de una página, como el resumen del menú en la ficha del restaurante, no muestra
  un error propio si falla: queda su texto neutro y la página sigue usable.
- La cabecera de una página es `app-page-header` (`@shared/ui`): la etiqueta (`eyebrow`), el título
  (el `h1`, con `tabindex="-1"`) y el subtítulo. Lo que va al lado, como un botón o el contador, va
  como contenido; el contador es un `<p appCountPill>` con su ícono y no se parte en dos líneas. La
  página lleva el foco al título con el método `focus()` de la cabecera.
- Una página que se abre desde otra de la app lleva el foco a su título cuando termina de cargar.
  El router abre cada página arriba (`withInMemoryScrolling` con `scrollPositionRestoration: 'top'`).
  Eso no se prueba en `TestBed`, porque el router solo lo activa cuando arranca la app; se revisa
  en el navegador.
- Una página que cuelga de otra (el menú del dueño, el detalle de un pedido) empieza con
  `app-back-link` (`@shared/ui`), que dice adónde vuelve ("‹ Mi restaurante") y recibe el destino
  en `link`. Un `link` relativo, como `..`, se resuelve desde la ruta de la página.
- Las columnas que comparten un encabezado y sus filas se definen una vez como token en `@theme`
  (`--grid-template-columns-accounts`), no como valor arbitrario repetido.
- Los precios se muestran con `formatPrice` (`@shared/utils`), en bolivianos con el formato de
  Bolivia: `Bs 45,00`.
- Las fechas de la API llegan en UTC y se muestran en la hora local del navegador con
  `formatDateTime` (`@shared/utils`): `8 nov 2026, 11:00`, con reloj de 24 horas. Van en un
  `<time datetime="...">` con el instante original. Los tests le pasan la zona
  (`America/La_Paz`) para no depender de la máquina.
- El id de una ruta (`/pedidos/:id`, `/restaurantes/:id`) se lee con `parseId` (`@shared/utils`).
  Si no es un número válido, la página muestra "No encontramos…" sin llamar al backend.
- "No encontramos…" es `app-not-found` (`@shared/ui`), para un id inválido o un `404`: recibe el
  título (que es el `h1` de la página) y el mensaje, la salida va como contenido (`<a appButton>`) y
  la página le lleva el foco con su método `focus()`.
- El carrito sale solo de `CartStore` (`@core/cart`). Las sumas del carrito se hacen en centavos
  (`estimatedSubtotal`) y la suma de todo se rotula "Total", como pide el enunciado, con la nota de
  que se confirma al hacer el pedido: el total que vale es el que devuelve la API al confirmar. Como `/carrito` lee el carrito sin pedirlo, su "cargando" es la confirmación en curso, y
  su error deja el carrito intacto.
- Agregar algo que no se puede, como un producto agotado o de un restaurante cerrado, es un botón
  con `disabled`: el motivo ya está a la vista. Un paso de cantidad que llegó a su límite (1 o 99)
  usa `aria-disabled`, para no perder el foco mientras se toca.
- Lo que cambia el carrito sin cambiar de pantalla (agregar, cambiar una cantidad, quitar) se anuncia
  en una región `aria-live="polite"` fija de la página ("Agregaste Silpancho al carrito. Tienes 3
  productos."), no con un aviso visible. Al quitar una línea, el foco pasa al "Quitar" de la
  siguiente, o al de la anterior si era la última; con el carrito vacío, al título.
- Una barra fija abajo, como "Ver carrito" en el menú del celular, lleva `data-cart-bar`, que agranda
  el margen de scroll inferior para que no tape el elemento con el foco, y va al final del DOM para
  que el Tab la alcance después del contenido.
- Un estado corto (Abierto, Cerrado, Agotado, Suspendida) es un `app-badge` (`@shared/ui`) con su
  `tone`: `success` para lo que funciona, `neutral` para lo que está en pausa y `danger` para lo que
  bloqueó un admin. `size="sm"` va dentro de una fila y `md` en una ficha. El texto siempre dice el
  estado; el color solo lo acompaña.
- El estado de un restaurante es un `app-restaurant-status-badge` (`@shared/ui`), que toma `open` y
  `suspended` y muestra Abierto, Cerrado o Suspendido con `restaurantStatusOf`
  (`@shared/utils/restaurant-status`). Lo usan la ficha del dueño, el panel del admin y la lista y el
  menú públicos, que le pasan `publicStatus(restaurant)` porque la API pública no devuelve
  restaurantes suspendidos.
- La categoría de un restaurante se nombra con `RESTAURANT_CATEGORY_LABELS`
  (`@shared/utils/restaurant-category`), que también da el orden del `select` del formulario. Va
  debajo del nombre, en la tarjeta del listado, en la ficha del menú y en la del dueño.
- La imagen de un restaurante o de un producto es un `app-cover-image` (`@shared/ui`): muestra la
  dirección con `NgOptimizedImage` en modo `fill` y, si no hay imagen o no carga, no dibuja nada y
  queda a la vista lo que tiene detrás: la inicial del local o el fondo de la miniatura. Es
  decorativa (`alt=""`), porque el nombre siempre está al lado, y su contenedor necesita posición
  (`absolute inset-0` en el cuadro de la inicial, `relative` en una miniatura). Un producto agotado
  la muestra en gris (`grayscale`).
- Los datos del restaurante se editan con el mismo formulario del registro, que aparece en el lugar
  de la ficha al tocar "Editar datos", con "Guardar cambios" y "Cancelar". Al abrirlo, el foco va al
  nombre; al guardar o cancelar, vuelve a "Editar datos".
- El estado de un pedido es un `app-order-status-badge` (`@shared/ui`), la única fuente para todas
  las features: toma el nombre de `ORDER_STATUS_LABELS` (`@shared/utils/order-status`) y elige el
  tono. Los nombres son los del enunciado (Pendiente, Aceptado, En preparación, Listo, Completado)
  y los tonos siguen el camino del pedido: Pendiente en `warning` (espera que alguien actúe),
  Aceptado y En preparación en `info`, Listo en `success`, Completado y Cancelado en `neutral`
  (terminados) y Rechazado en `danger`.

## Sesión

Lo decidido en [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md):

- El usuario actual sale solo de `SessionStore` (`@core/auth`); ninguna feature guarda su propia
  copia.
- Las rutas protegidas usan `authGuard` o `roleGuard('OWNER')`; las de ingreso y registro,
  `guestGuard`. Después de ingresar, o cuando un guard saca a alguien de una ruta, se lo manda a su
  inicio con `homeFor(role)` (`@core/auth/home-path`), nunca a una ruta fija. El logo del header
  lleva siempre a la portada pública `/`.
- Los nombres de los roles en la interfaz salen de `ROLE_LABELS` (`@core/auth/account`).
- No se guardan credenciales ni datos de sesión en `localStorage` ni en `sessionStorage`. Lo único
  que va a `localStorage` es el carrito de `core/cart` (restaurante, productos y cantidades), que se
  vacía al cerrar sesión ([modelo-de-datos.md](../modelo-de-datos.md#el-carrito)).
- No se desactiva la protección XSRF del `HttpClient` (`withNoXsrfProtection`).
- Las pantallas de ingreso (`/ingresar`) y registro (`/registro`) son de la feature `auth`.

## Templates

- Control flow nuevo: `@if`, `@for` (siempre con `track` por id), `@switch`.
- Etiquetas autocerradas para componentes sin contenido: `<app-header />`.
- Imágenes con `NgOptimizedImage` (`ngSrc`).
- Sin estilos inline, botones siempre con `type`, imágenes con `alt`, campos con `label`.

## Estilos

- Utilidades de Tailwind con los tokens definidos en `src/styles.css`: `bg-brand`, `text-muted`,
  `border-line`, `bg-success-soft`. Nunca colores sueltos (`bg-[#ff0000]`, `text-red-600`).
- Si hace falta un color nuevo, se agrega como token en `@theme` con un nombre semántico.
- Si un conjunto de clases se repite, se crea un componente en `shared/ui`, no una clase con
  `@apply`.
- Diseño mobile first: la app de cliente se usa sobre todo en el celular.
- El foco se marca con un contorno sólido (`outline`), nunca solo con un anillo translúcido. Los
  controles táctiles miden al menos 44 px (`min-h-11`).
- La tipografía es Plus Jakarta Sans, desde Google Fonts. El build de producción incrusta su hoja de
  estilos, así que `npm run build` necesita conexión; si hiciera falta compilar sin red, se sirve el
  archivo desde `public/fonts`.

## Formularios

- Formularios reactivos tipados (`NonNullableFormBuilder`).
- Validación al salir del campo y mensajes en español debajo de cada campo.
- El botón principal lleva `appButton`, también un enlace que es la acción principal (como "Ver
  restaurantes" cuando un restaurante no existe). Los secundarios, como "Cancelar", "Editar" o
  "Borrar", llevan `appSecondaryButton` (`tone="danger"` para borrar). Un secundario que va al
  lado del principal, como "Seguir explorando" junto a "Ver mi pedido", usa `size="lg"` para tener
  su misma altura, nunca una clase `min-h-*` suelta. Mientras se envía, el
  principal muestra que está trabajando y usa `aria-disabled` en lugar de `disabled`, para no
  perder el foco; "Cancelar" también queda con `aria-disabled`, y `submit()` ignora los envíos
  repetidos. En el celular los botones van uno debajo del otro, en el mismo orden que el Tab.
- Un formulario que crea o edita un elemento de una lista se abre en el lugar, sin modal: el
  elemento se convierte en su formulario. Hay uno solo abierto a la vez, el foco va a su primer
  campo, Escape o "Cancelar" lo cierran, y al cerrarse el foco vuelve al botón que lo abrió.
- Al enviar con errores, el foco va al primer campo inválido (`focusFirstInvalid`).
- Cada campo va en `app-form-field` (etiqueta y mensaje debajo). Los inputs de texto, los
  `textarea` y los `select` llevan `appTextInput`, que toma el `id` del campo y lo enlaza con su
  mensaje por `aria-describedby`. Los errores que no son de un campo van en `app-alert`.
- Los mensajes de cada regla se escriben en la página o en el componente del formulario y se eligen
  con `validationMessage` (`@shared/utils`), que prioriza el error que mandó el backend.
- Un precio se escribe en un input de texto con `inputmode="decimal"` y acepta coma o punto
  (`45,50` o `45.50`), con hasta dos decimales.

## Estilo de código

- Prettier formatea todo (`npm run format`); el plugin de Tailwind ordena las clases.
- ESLint con reglas de Angular, accesibilidad y límites entre carpetas (`npm run lint`).
- Imports entre áreas con alias: `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`.
  Dentro de la misma feature, imports relativos.
- Sin comentarios, sin `any`, sin `!` (non-null assertion), sin `console.log`.
- Los textos de la interfaz están en español.
