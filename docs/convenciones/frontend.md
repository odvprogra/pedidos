# Convenciones del frontend

Complementa a [arquitectura.md](../arquitectura.md). El ejemplo completo de cada pieza está en
[.claude/skills/frontend-feature/reference.md](../../.claude/skills/frontend-feature/reference.md).

## Nombres

Se sigue la guía de estilo de Angular 2025: archivos sin sufijo de tipo para componentes.

| Pieza                   | Archivo                                              | Clase / export       |
| ----------------------- | ---------------------------------------------------- | -------------------- |
| Página (enrutada)       | `pages/restaurant-list-page/restaurant-list-page.ts` | `RestaurantListPage` |
| Componente              | `components/restaurant-card/restaurant-card.ts`      | `RestaurantCard`     |
| Cliente HTTP            | `data-access/restaurant-api.ts`                      | `RestaurantApi`      |
| Estado compartido       | `data-access/menu-store.ts`                          | `MenuStore`          |
| Modelo                  | `models/restaurant.ts`                               | `Restaurant`         |
| Rutas de la feature     | `restaurants.routes.ts`                              | `RESTAURANTS_ROUTES` |
| Componente reutilizable | `shared/ui/badge/badge.ts`                           | `Badge`              |

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
- El estado que comparten varias páginas de una feature va en un `XxxStore` (`@Injectable` con
  señales). Una librería de estado global (NgRx u otra) requiere una ADR.
- Todas las URLs usan `environment.apiUrl`.
- Toda vista con datos cubre cuatro estados: cargando, vacío, error y éxito. El error de carga es
  `app-load-error` (`@shared/ui`): recibe el título y el mensaje, emite `retry` al tocar
  "Reintentar", y la página le lleva el foco con su método `focus()`. El vacío es `app-empty-state`
  (`@shared/ui`): recibe el título y el mensaje, el ícono va con el atributo `emptyStateIcon` y la
  acción, si la hay, como contenido.
- Los errores del backend llegan como Problem Details. Si la feature conoce el `code`, muestra su
  propio mensaje en español, debajo del campo o en una alerta; si no lo conoce, muestra el `detail`.
  Los `errors[]` se asignan a los campos con `applyFieldErrors` (`@shared/utils`).
- Una lista paginada recibe un `Page<T>` (`@core/http/page`) y usa `app-pagination`
  (`@shared/ui`). La primera carga muestra el esqueleto; al cambiar de página, la lista anterior
  queda visible con `aria-busy` y la paginación deshabilitada hasta que llega la nueva. Cuando
  llega, el foco va al título de la página; si falla, a "Reintentar".
- Una acción que afecta a otra persona, como suspender una cuenta, o que no se puede deshacer, como
  borrar un producto del menú, se confirma dentro de la misma fila o tarjeta con `app-confirm-panel`
  (`@shared/ui`), sin modal: el foco va a "Cancelar" al abrir la pregunta, Escape la cierra y el
  foco vuelve al botón. Si la acción no se puede hacer, como borrar una categoría con productos, el
  mismo panel lo explica en tono de aviso y solo ofrece "Entendido". El botón "Cancelar" del panel
  puede decir lo que se mantiene ("Mantener pedido") cuando la acción misma se llama cancelar.
- Los pasos que hacen avanzar un pedido por su camino normal (Aceptar, Marcar listo, Entregar) no
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
- El resultado de una acción se anuncia en un `app-alert dismissible` fijo bajo el header, con
  `data-sticky-notice`: `tone="success"` (que usa `role="status"`) o el tono de error. Ese atributo
  agranda el margen de scroll de la página para que el aviso no tape el elemento con el foco. Cada
  aviso es un nodo nuevo, con su id, así un mismo mensaje repetido se vuelve a anunciar.
- Un dato secundario de una página, como el resumen del menú en la ficha del restaurante, no muestra
  un error propio si falla: queda su texto neutro y la página sigue usable.
- Una página que se abre desde otra de la app lleva el foco a su título cuando termina de cargar.
  El router abre cada página arriba (`withInMemoryScrolling` con `scrollPositionRestoration: 'top'`).
  Eso no se prueba en `TestBed`, porque el router solo lo activa cuando arranca la app; se revisa
  en el navegador.
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
- El carrito sale solo de `CartStore` (`@core/cart`). Las sumas del carrito se hacen en centavos
  (`estimatedSubtotal`) y se rotulan como "estimado": el total que vale es el que devuelve la API al
  confirmar. Como `/carrito` lee el carrito sin pedirlo, su "cargando" es la confirmación en curso, y
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
  (`@shared/utils/restaurant-status`). Lo usan la ficha del dueño y el panel del admin.
- El estado de un pedido es un `app-order-status-badge` (`@shared/ui`), la única fuente para todas
  las features: toma el nombre de `ORDER_STATUS_LABELS` (`@shared/utils/order-status`) y elige el
  tono. Los tonos siguen el camino del pedido: Pendiente en `warning` (espera que alguien actúe), En preparación en `info`,
  Listo para retirar en `success`, Retirado y Cancelado en `neutral` (terminados) y Rechazado en
  `danger`.

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
  "Borrar", llevan `appSecondaryButton` (`tone="danger"` para borrar). Mientras se envía, el
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
