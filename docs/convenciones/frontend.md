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
- Los errores del backend llegan como Problem Details; se muestra el `detail` y los `errors[]` se
  asocian a los campos del formulario.

## Sesión

Lo decidido en [ADR-0008](../adr/0008-autenticacion-con-sesion-y-roles.md):

- El usuario actual sale solo de `SessionStore` (`@core/auth`); ninguna feature guarda su propia
  copia.
- Las rutas protegidas usan `authGuard` o `roleGuard('OWNER')`.
- No se guardan credenciales ni datos de sesión en `localStorage` ni en `sessionStorage`.
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

## Formularios

- Formularios reactivos tipados (`NonNullableFormBuilder`).
- Validación al salir del campo y mensajes en español debajo de cada campo.
- Mientras se envía, el botón se deshabilita y muestra que está trabajando.

## Estilo de código

- Prettier formatea todo (`npm run format`); el plugin de Tailwind ordena las clases.
- ESLint con reglas de Angular, accesibilidad y límites entre carpetas (`npm run lint`).
- Imports entre áreas con alias: `@core/*`, `@shared/*`, `@layout/*`, `@features/*`, `@env/*`.
  Dentro de la misma feature, imports relativos.
- Sin comentarios, sin `any`, sin `!` (non-null assertion), sin `console.log`.
- Los textos de la interfaz están en español.
