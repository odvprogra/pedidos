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
| Estado compartido       | `data-access/cart-store.ts`                          | `CartStore`          |
| Modelo                  | `models/restaurant.ts`                               | `Restaurant`         |
| Rutas de la feature     | `restaurants.routes.ts`                              | `RESTAURANTS_ROUTES` |
| Componente reutilizable | `shared/ui/status-badge/status-badge.ts`             | `StatusBadge`        |

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
- Toda vista con datos cubre cuatro estados: cargando, vacío, error y éxito.
- Los errores del backend llegan como Problem Details. Si la feature conoce el `code`, muestra su
  propio mensaje en español, debajo del campo o en una alerta; si no lo conoce, muestra el `detail`.
  Los `errors[]` se asignan a los campos con `applyFieldErrors` (`@shared/utils`).
- Una lista paginada recibe un `Page<T>` (`@core/http/page`) y usa `app-pagination`
  (`@shared/ui`). La primera carga muestra el esqueleto; al cambiar de página, la lista anterior
  queda visible con `aria-busy` y la paginación deshabilitada hasta que llega la nueva.
- Una acción que cambia algo y se puede deshacer se confirma dentro de la misma fila o tarjeta, sin
  modal: el foco va a "Cancelar" al abrir la pregunta y vuelve al botón al cerrarla. El resultado
  se anuncia arriba de la lista con `app-alert`: `tone="success"` (que usa `role="status"`) o el
  tono de error.

## Sesión

Lo decidido en [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md):

- El usuario actual sale solo de `SessionStore` (`@core/auth`); ninguna feature guarda su propia
  copia.
- Las rutas protegidas usan `authGuard` o `roleGuard('OWNER')`; las de ingreso y registro,
  `guestGuard`. Cuando hay que mandar a alguien a "su inicio", se usa `homeFor(role)` de
  `@core/auth/home-path`, nunca una ruta fija.
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
- El botón principal lleva `appButton`. Mientras se envía, muestra que está trabajando y usa
  `aria-disabled` en lugar de `disabled`, para no perder el foco; `submit()` ignora los envíos
  repetidos.
- Al enviar con errores, el foco va al primer campo inválido (`focusFirstInvalid`).
- Cada campo va en `app-form-field` (etiqueta y mensaje debajo). Los inputs de texto llevan
  `appTextInput`, que toma el `id` del campo y lo enlaza con su mensaje por `aria-describedby`. Los
  errores que no son de un campo van en `app-alert`.
- Los mensajes de cada regla se escriben en la página y se eligen con `validationMessage`
  (`@shared/utils`), que prioriza el error que mandó el backend.

## Estilo de código

- Prettier formatea todo (`npm run format`); el plugin de Tailwind ordena las clases.
- ESLint con reglas de Angular, accesibilidad y límites entre carpetas (`npm run lint`).
- Imports entre áreas con alias: `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`.
  Dentro de la misma feature, imports relativos.
- Sin comentarios, sin `any`, sin `!` (non-null assertion), sin `console.log`.
- Los textos de la interfaz están en español.
