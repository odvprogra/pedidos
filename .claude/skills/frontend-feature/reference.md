# Ejemplo de referencia: feature `restaurant-admin`

Es el código real de la feature `restaurant-admin`, verificado con `npm run lint`, `npm test -- --watch=false` y `npm run build`. Es la forma canónica de cada pieza; al crear algo nuevo se copia la estructura y se cambian nombres, textos y reglas. Los tests largos aparecen recortados y lo dicen.

Si la feature cambia, este archivo se actualiza en el mismo PR. Las reglas que el código aplica están en `docs/convenciones/frontend.md`, y los endpoints que llama, en `docs/convenciones/api.md`.

## Estructura

```text
frontend/src/app/features/restaurant-admin/
├── restaurant-admin.routes.ts
├── pages/
│   ├── my-restaurant-page/     La ficha del restaurante, o el registro si todavía no tiene
│   ├── catalog-page/           El menú: categorías y productos editados en el lugar
│   └── orders-page/            Los pedidos del restaurante: "En curso" y "Terminados"
├── components/
│   ├── restaurant-card/        La ficha con su insignia, el interruptor y los enlaces al menú y a los pedidos
│   ├── registration-steps/     La guía de tres pasos al lado del registro
│   ├── category-header/        Nombre de la categoría, renombrar y borrar con confirmación
│   ├── category-form/          Formulario de una categoría
│   ├── product-row/            Un producto con su interruptor, Editar y Borrar
│   ├── product-form/           Formulario de un producto
│   └── order-card/             Un pedido con sus ítems y el paso siguiente según el estado
├── data-access/
│   ├── restaurant-api.ts
│   ├── catalog-api.ts
│   └── order-api.ts
└── models/
    ├── restaurant.ts           La forma del JSON
    ├── restaurant-status.ts    Estado y textos, en funciones puras
    ├── restaurant-error.ts     Qué hacer y qué decir con cada `code` del backend
    ├── catalog.ts              El menú y sus cambios, en funciones puras
    ├── catalog-error.ts
    ├── price.ts                Leer y validar un precio escrito con coma o punto
    ├── order.ts                El pedido, los filtros y los pasos de cada estado
    └── order-error.ts
```

## Piezas compartidas

Lo que ya existe y no se vuelve a escribir en una feature:

| Pieza                                                  | Para qué                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `toProblemDetails` (`@core/http`)                      | Convierte cualquier error HTTP en `ProblemDetails`, también sin conexión                   |
| `Page<T>` (`@core/http/page`)                          | La forma de una página de la API                                                           |
| `app-page-header` (`@shared/ui`)                       | Etiqueta, `h1` con `focus()` y subtítulo; lo de al lado va como contenido                  |
| `appCountPill` (`@shared/ui`)                          | La píldora del contador ("12 pedidos") junto al título, en una sola línea                  |
| `app-back-link` (`@shared/ui`)                         | "‹ Mi restaurante": vuelve a `link`, relativo a la ruta de la página                       |
| `app-not-found` (`@shared/ui`)                         | "No encontramos…" como `h1` de la página, con la salida como contenido y `focus()`         |
| `app-load-error` (`@shared/ui`)                        | El error de carga con "Reintentar" y su método `focus()`                                   |
| `app-empty-state` (`@shared/ui`)                       | El vacío: título, mensaje, ícono (`emptyStateIcon`) y una acción opcional                  |
| `appSkeleton` (`@shared/ui`)                           | Una barra del esqueleto de carga: pulso y color; la página pone tamaño y forma             |
| `app-sticky-notice`, `NoticeSlot` (`@shared/ui`)       | El aviso fijo bajo el header con el resultado de una acción, uno a la vez y con su id      |
| `app-alert` (`@shared/ui`)                             | Avisos: `danger`, `warning` o `success` (`role="status"`), `dismissible`                   |
| `appButton`, `appSecondaryButton` (`@shared/ui`)       | Botón principal y secundarios (`tone="danger"`, `size="lg"`, `working`)                    |
| `app-form-field`, `appTextInput`                       | Etiqueta, campo y mensaje enlazados por `aria-describedby`                                 |
| `app-confirm-panel`, `ConfirmationSlot` (`@shared/ui`) | La confirmación dentro de la fila, sin modal, y cuál está abierta (una a la vez)           |
| `app-pagination` (`@shared/ui`)                        | "‹ Anterior · Página X de Y · Siguiente ›"                                                 |
| `app-badge` (`@shared/ui`)                             | Insignia de estado con `tone` (`success`, `neutral`, `danger`, `warning`, `info`) y `size` |
| `app-order-status-badge` (`@shared/ui`)                | La insignia de un pedido según su `status`, con su nombre y su tono                        |
| `app-restaurant-status-badge` (`@shared/ui`)           | Abierto, Cerrado o Suspendido según `open` y `suspended`, con su tono                      |
| `app-spinner` (`@shared/ui`)                           | El indicador dentro de un botón que trabaja                                                |
| `restaurantStatusOf` (`@shared/utils`)                 | El estado de un restaurante (`open`, `closed`, `suspended`) y su nombre                    |
| `validationMessage` (`@shared/utils`)                  | El mensaje de un campo, con prioridad para el error del backend                            |
| `applyFieldErrors` (`@shared/utils`)                   | Asigna los `errors[]` del backend a los campos del formulario                              |
| `focusFirstInvalid` (`@shared/utils`)                  | Lleva el foco al primer campo inválido después de renderizar                               |
| `formatPrice` (`@shared/utils`)                        | `Bs 45,00`                                                                                 |
| `formatDateTime` (`@shared/utils`)                     | `8 nov 2026, 11:00` en la hora local                                                       |
| `parseId` (`@shared/utils`)                            | El id de una ruta (`/pedidos/:id`) o `null` si no es un número válido                      |
| `describeUnits` (`@shared/utils`)                      | `1 producto`, `3 productos`                                                                |
| `orderPath`, `ORDERS_PATH` (`@core/orders`)            | Las rutas de los pedidos del cliente                                                       |
| `CartStore` (`@core/cart`)                             | El carrito de un restaurante, guardado en `localStorage`                                   |

## Modelo

Las interfaces tienen la forma exacta del JSON de la API. Un campo opcional del backend es `string | null`, no `?`.

`frontend/src/app/features/restaurant-admin/models/restaurant.ts`

```ts
export interface Restaurant {
  id: number;
  name: string;
  description: string | null;
  address: string;
  open: boolean;
  suspended: boolean;
}

export interface RestaurantRegistration {
  name: string;
  description: string;
  address: string;
}
```

## Modelo: estado y textos

Lo que la interfaz decide a partir de los datos (qué texto acompaña a cada estado) son funciones puras en `models/`. Así se prueban sin `TestBed` y el componente solo las llama. El estado del restaurante y su insignia los comparte con el panel del admin, así que viven en `@shared/utils/restaurant-status` y `app-restaurant-status-badge`.

`frontend/src/app/features/restaurant-admin/models/restaurant-status.ts`

```ts
export function openingHint(open: boolean): string {
  return open
    ? 'Abierto: los clientes ya pueden hacer pedidos.'
    : 'Cerrado: los clientes lo ven, pero no pueden pedir.';
}

export function openingProgress(open: boolean): string {
  return open ? 'Abriendo tu restaurante…' : 'Cerrando tu restaurante…';
}

export function openingDone(open: boolean, name: string): string {
  return open
    ? `Abriste ${name}. Ya recibe pedidos.`
    : `Cerraste ${name}. Ya no recibe pedidos nuevos.`;
}
```

## Modelo: errores del backend

Cada feature traduce los `code` que conoce a un mensaje en español y, si no lo conoce, muestra el `detail`. Las funciones `isXxx` deciden qué hace la página con cada error; un `404` sin su `code` no se confunde con un restaurante que falta.

`frontend/src/app/features/restaurant-admin/models/restaurant-error.ts`

```ts
import { ProblemDetails } from '@core/http/problem-details';

const NOT_REGISTERED = 'restaurant.not_found';
const ALREADY_REGISTERED = 'restaurant.already_registered';
const SUSPENDED = 'restaurant.suspended';

const MESSAGES = new Map<string, string>([
  [ALREADY_REGISTERED, 'Ya registraste un restaurante con esta cuenta.'],
  [SUSPENDED, 'No pudimos abrir tu restaurante: está suspendido.'],
  [NOT_REGISTERED, 'No encontramos tu restaurante.'],
  ['validation_failed', 'Revisa los datos marcados e intenta de nuevo.'],
  ['access_denied', 'Tu cuenta no tiene permiso para administrar un restaurante.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function isNotRegistered(problem: ProblemDetails): boolean {
  return problem.status === 404 && problem.code === NOT_REGISTERED;
}

export function isAlreadyRegistered(problem: ProblemDetails): boolean {
  return problem.code === ALREADY_REGISTERED;
}

export function isSuspended(problem: ProblemDetails): boolean {
  return problem.code === SUSPENDED;
}

export function describeRestaurantError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
```

## Cliente HTTP

Devuelve `Observable`, no guarda estado y arma las URLs con `environment.apiUrl`. Una acción sin cuerpo manda `null`.

`frontend/src/app/features/restaurant-admin/data-access/restaurant-api.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Restaurant, RestaurantRegistration } from '../models/restaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants`;

  mine(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/mine`);
  }

  register(registration: RestaurantRegistration): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.baseUrl, registration);
  }

  open(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mine/open`, null);
  }

  close(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mine/close`, null);
  }
}
```

## Componente de presentación

Solo recibe `input()` y emite `output()`; no inyecta servicios de datos. No cambia el restaurante: pide el cambio con `openChange` y la página decide. Mientras la página trabaja (`busy`), ignora los toques.

`frontend/src/app/features/restaurant-admin/components/restaurant-card/restaurant-card.ts`

```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RestaurantStatusBadge } from '@shared/ui/restaurant-status-badge/restaurant-status-badge';
import { Spinner } from '@shared/ui/spinner/spinner';
import { Restaurant } from '../../models/restaurant';
import { openingHint, openingProgress } from '../../models/restaurant-status';

@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, RestaurantStatusBadge, Spinner],
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly busy = input(false);
  readonly menuSummary = input<string | null>(null);
  readonly openChange = output<boolean>();

  protected readonly initial = computed(() =>
    this.restaurant().name.trim().charAt(0).toUpperCase(),
  );
  protected readonly hint = computed(() => {
    const open = this.restaurant().open;
    return this.busy() ? openingProgress(!open) : openingHint(open);
  });
  protected readonly idPrefix = computed(() => `restaurant-${this.restaurant().id}`);

  protected toggle(): void {
    if (this.busy()) {
      return;
    }
    this.openChange.emit(!this.restaurant().open);
  }
}
```

## Componente de presentación: template

El interruptor es un `button` con `role="switch"`, `aria-checked` y `aria-disabled` mientras trabaja. Los ids salen del id del restaurante, así dos tarjetas en la misma página no chocan. Los íconos son SVG en línea con `aria-hidden`.

`frontend/src/app/features/restaurant-admin/components/restaurant-card/restaurant-card.html`

```html
<article
  class="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
  [attr.aria-labelledby]="idPrefix() + '-name'"
>
  <div class="relative h-24 overflow-hidden bg-brand sm:h-28">
    <svg
      aria-hidden="true"
      class="absolute -top-4 right-4 size-36 text-white/15 sm:right-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8" />
      <path d="M10 20v-5h4v5" />
    </svg>
  </div>

  <div class="px-5 pb-6 sm:px-6">
    <div class="-mt-9 flex items-end justify-between gap-3">
      <span
        aria-hidden="true"
        class="relative grid size-18 shrink-0 place-items-center rounded-2xl border-4 border-surface bg-accent text-3xl font-extrabold text-ink shadow-md"
      >
        {{ initial() }}
      </span>
      <app-restaurant-status-badge class="mb-1" data-status [restaurant]="restaurant()" />
    </div>

    <h2
      class="mt-4 text-2xl font-extrabold tracking-tight wrap-anywhere"
      [id]="idPrefix() + '-name'"
    >
      {{ restaurant().name }}
    </h2>
    @if (restaurant().description; as description) {
      <p class="mt-1 wrap-anywhere text-muted">{{ description }}</p>
    }
    <p class="mt-4 flex items-start gap-2 text-sm font-semibold">
      <svg
        aria-hidden="true"
        class="mt-px size-5 shrink-0 text-brand"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </svg>
      <span class="wrap-anywhere">
        <span class="sr-only">Dirección: </span>{{ restaurant().address }}
      </span>
    </p>
  </div>

  <div class="border-t border-line bg-canvas px-5 py-5 sm:px-6">
    @if (restaurant().suspended) {
      <div class="flex items-start gap-3 rounded-xl bg-warning-soft p-4 text-warning">
        <svg
          aria-hidden="true"
          class="mt-px size-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        <div>
          <p class="font-bold">Tu restaurante está suspendido</p>
          <p class="mt-0.5 text-sm">
            Los clientes no lo ven y no puedes abrirlo, pero sí terminar los pedidos en curso. Habla
            con el administrador para reactivarlo.
          </p>
        </div>
      </div>
    } @else {
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="font-bold" [id]="idPrefix() + '-open-label'">Recibir pedidos</p>
          <p class="mt-0.5 text-sm text-muted" [id]="idPrefix() + '-open-hint'">{{ hint() }}</p>
        </div>
        <button
          type="button"
          role="switch"
          class="relative inline-flex h-11 w-18 shrink-0 items-center rounded-full p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-disabled:cursor-wait"
          [class]="restaurant().open ? 'bg-success' : 'bg-muted'"
          [attr.aria-checked]="restaurant().open"
          [attr.aria-labelledby]="idPrefix() + '-open-label'"
          [attr.aria-describedby]="idPrefix() + '-open-hint'"
          [attr.aria-disabled]="busy()"
          (click)="toggle()"
        >
          <span
            aria-hidden="true"
            class="grid size-8 place-items-center rounded-full bg-surface text-muted shadow-md transition-transform motion-reduce:transition-none"
            [class.translate-x-7]="restaurant().open"
          >
            @if (busy()) {
              <app-spinner />
            }
          </span>
        </button>
      </div>
    }
  </div>

  <a
    routerLink="pedidos"
    data-orders-link
    class="group flex items-center justify-between gap-4 border-t border-line px-5 py-4 transition hover:bg-brand-soft/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-6"
  >
    <span class="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"
      >
        <svg
          class="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </span>
      <span class="min-w-0">
        <span class="block font-bold">Pedidos</span>
        <span class="block text-sm text-muted">Acepta y prepara los pedidos de tus clientes</span>
      </span>
    </span>
    <svg
      aria-hidden="true"
      class="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand motion-reduce:transition-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  </a>

  <a
    routerLink="menu"
    class="group flex items-center justify-between gap-4 border-t border-line px-5 py-4 transition hover:bg-brand-soft/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-6"
  >
    <span class="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        class="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"
      >
        <svg
          class="size-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M8 8h6M8 12h6M8 16h3" />
        </svg>
      </span>
      <span class="min-w-0">
        <span class="block font-bold">Tu menú</span>
        <span class="block text-sm text-muted" data-menu-summary>
          {{ menuSummary() ?? 'Categorías y productos' }}
        </span>
      </span>
    </span>
    <svg
      aria-hidden="true"
      class="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand motion-reduce:transition-none"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  </a>
</article>
```

## Página

La página carga los datos y maneja el estado. El estado de la vista es una unión discriminada (`loading`, `missing`, `failed`, `ready`), así el template no puede mostrar dos estados a la vez. El foco va al título cuando la página llega desde otra o cuando termina una acción, y a "Reintentar" cuando la carga falla; el título lo enfoca `app-page-header` con su método `focus()`. El aviso vive en un `NoticeSlot`, que le da a cada aviso un id nuevo, así un mismo mensaje repetido se vuelve a anunciar.

`frontend/src/app/features/restaurant-admin/pages/my-restaurant-page/my-restaurant-page.ts`

```ts
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toProblemDetails } from '@core/http/problem-details';
import { Alert } from '@shared/ui/alert/alert';
import { Button } from '@shared/ui/button/button';
import { FormField } from '@shared/ui/form-field/form-field';
import { LoadError } from '@shared/ui/load-error/load-error';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Skeleton } from '@shared/ui/skeleton/skeleton';
import { Spinner } from '@shared/ui/spinner/spinner';
import { NoticeSlot } from '@shared/ui/sticky-notice/notice-slot';
import { StickyNotice } from '@shared/ui/sticky-notice/sticky-notice';
import { TextInput } from '@shared/ui/text-input/text-input';
import { applyFieldErrors } from '@shared/utils/field-errors';
import { focusFirstInvalid } from '@shared/utils/focus-first-invalid';
import { ValidationMessages, validationMessage } from '@shared/utils/validation-message';
import { map } from 'rxjs';
import { RegistrationSteps } from '../../components/registration-steps/registration-steps';
import { RestaurantCard } from '../../components/restaurant-card/restaurant-card';
import { CatalogApi } from '../../data-access/catalog-api';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { Catalog, summarize } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import {
  describeRestaurantError,
  isAlreadyRegistered,
  isNotRegistered,
  isSuspended,
} from '../../models/restaurant-error';
import { openingDone } from '../../models/restaurant-status';

type PageState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; restaurant: Restaurant };

type RegistrationField = 'name' | 'description' | 'address';

const DESCRIPTION_LIMIT = 300;

const MESSAGES: Record<RegistrationField, ValidationMessages> = {
  name: {
    required: 'Escribe el nombre de tu restaurante.',
    pattern: 'Escribe el nombre de tu restaurante.',
    maxlength: 'Usa hasta 120 caracteres.',
  },
  description: {
    maxlength: `Usa hasta ${DESCRIPTION_LIMIT} caracteres.`,
  },
  address: {
    required: 'Escribe dónde queda tu restaurante.',
    pattern: 'Escribe dónde queda tu restaurante.',
    maxlength: 'Usa hasta 200 caracteres.',
  },
};

@Component({
  selector: 'app-my-restaurant-page',
  imports: [
    ReactiveFormsModule,
    Alert,
    Button,
    FormField,
    LoadError,
    PageHeader,
    RegistrationSteps,
    RestaurantCard,
    Skeleton,
    Spinner,
    StickyNotice,
    TextInput,
  ],
  templateUrl: './my-restaurant-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyRestaurantPage implements OnInit {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly catalogApi = inject(CatalogApi);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly header = viewChild(PageHeader);
  private readonly loadError = viewChild(LoadError);
  private readonly menu = signal<Catalog | null>(null);
  private readonly arrivedFromAnotherPage = Boolean(
    inject(Router).currentNavigation()?.previousNavigation,
  );

  protected readonly descriptionLimit = DESCRIPTION_LIMIT;
  protected readonly state = signal<PageState>({ status: 'loading' });
  protected readonly notice = new NoticeSlot();
  protected readonly submitting = signal(false);
  protected readonly formAlert = signal<string | null>(null);
  protected readonly toggling = signal(false);
  protected readonly menuSummary = computed(() => {
    const menu = this.menu();
    return menu ? summarize(menu) : null;
  });
  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    description: ['', Validators.maxLength(DESCRIPTION_LIMIT)],
    address: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(200)]],
  });
  protected readonly descriptionLength = toSignal(
    this.form.controls.description.valueChanges.pipe(map((description) => description.length)),
    { initialValue: 0 },
  );
  protected readonly registering = computed(() => this.state().status === 'missing');
  protected readonly title = computed(() =>
    this.registering() ? 'Registra tu restaurante' : 'Mi restaurante',
  );
  protected readonly subtitle = computed(() => {
    const current = this.state();
    if (current.status === 'missing') {
      return 'Completa los datos de tu local para empezar. Te toma un minuto.';
    }
    if (current.status === 'ready' && current.restaurant.suspended) {
      return 'Revisa en qué estado está tu restaurante.';
    }
    return 'Mira cómo te ven tus clientes y decide cuándo recibir pedidos.';
  });

  ngOnInit(): void {
    this.load(this.arrivedFromAnotherPage);
  }

  protected errorOf(field: RegistrationField): string | null {
    return validationMessage(this.form.controls[field], MESSAGES[field]);
  }

  protected retry(): void {
    this.load(true);
  }

  protected register(): void {
    if (this.submitting()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      focusFirstInvalid(this.host.nativeElement, this.injector);
      return;
    }

    this.submitting.set(true);
    this.formAlert.set(null);
    this.restaurantApi.register(this.form.getRawValue()).subscribe({
      next: (restaurant) => {
        this.submitting.set(false);
        this.state.set({ status: 'ready', restaurant });
        this.menu.set({ categories: [] });
        this.notice.show(
          'success',
          `¡Listo! Registraste ${restaurant.name}. Está cerrado: ábrelo cuando quieras recibir pedidos.`,
        );
        this.focusHeading();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const problem = toProblemDetails(error);
        if (isAlreadyRegistered(problem)) {
          this.notice.show(
            'warning',
            'Ya tenías un restaurante registrado. Te mostramos sus datos.',
          );
          this.load(true);
          return;
        }
        applyFieldErrors(this.form, problem.errors ?? []);
        this.formAlert.set(describeRestaurantError(problem));
        focusFirstInvalid(this.host.nativeElement, this.injector);
      },
    });
  }

  protected changeOpening(open: boolean): void {
    const current = this.state();
    if (current.status !== 'ready' || this.toggling()) {
      return;
    }
    const restaurant = current.restaurant;
    this.toggling.set(true);
    const request = open ? this.restaurantApi.open() : this.restaurantApi.close();
    request.subscribe({
      next: () => {
        this.toggling.set(false);
        this.state.set({ status: 'ready', restaurant: { ...restaurant, open } });
        this.notice.show('success', openingDone(open, restaurant.name));
      },
      error: (error: unknown) => {
        this.toggling.set(false);
        const problem = toProblemDetails(error);
        const outdated = isSuspended(problem) || isNotRegistered(problem);
        this.notice.show(outdated ? 'warning' : 'danger', describeRestaurantError(problem));
        if (outdated) {
          this.load(true);
        }
      },
    });
  }

  private load(moveFocus: boolean): void {
    this.state.set({ status: 'loading' });
    this.restaurantApi.mine().subscribe({
      next: (restaurant) => {
        this.show({ status: 'ready', restaurant }, moveFocus);
        this.loadMenu();
      },
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        this.show(
          isNotRegistered(problem)
            ? { status: 'missing' }
            : { status: 'failed', message: describeRestaurantError(problem) },
          moveFocus,
        );
      },
    });
  }

  private loadMenu(): void {
    this.menu.set(null);
    this.catalogApi.mine().subscribe({
      next: (menu) => this.menu.set(menu),
      error: () => this.menu.set(null),
    });
  }

  private show(state: PageState, moveFocus: boolean): void {
    this.state.set(state);
    if (state.status !== 'ready') {
      this.notice.clear();
    }
    if (!moveFocus) {
      return;
    }
    if (state.status === 'failed') {
      this.focusRetry();
    } else {
      this.focusHeading();
    }
  }

  private focusHeading(): void {
    afterNextRender(() => this.header()?.focus(), { injector: this.injector });
  }

  private focusRetry(): void {
    afterNextRender(() => this.loadError()?.focus(), { injector: this.injector });
  }
}
```

## Página: template con los cuatro estados

Éxito (la ficha), vacío (el registro, porque el dueño todavía no tiene restaurante), error (`app-load-error`) y cargando (un esqueleto con la forma de la ficha y `role="status"`, hecho con barras `appSkeleton`). La cabecera es `app-page-header` y el aviso va fijo bajo el header con `app-sticky-notice`. El formulario usa `app-form-field` y `appTextInput`, y el botón trabaja con `aria-disabled` en lugar de `disabled`.

`frontend/src/app/features/restaurant-admin/pages/my-restaurant-page/my-restaurant-page.html`

```html
<section class="mx-auto max-w-6xl px-4 py-8 sm:py-12">
  <app-page-header eyebrow="Panel del restaurante" [heading]="title()" [subtitle]="subtitle()" />

  @for (shown of notice.shown(); track shown.id) {
    <app-sticky-notice class="mt-6 max-w-2xl" [tone]="shown.tone" (dismissed)="notice.clear()">
      {{ shown.message }}
    </app-sticky-notice>
  }

  @let current = state();
  @if (current.status === 'ready') {
    <app-restaurant-card
      class="mt-6 block max-w-2xl"
      [restaurant]="current.restaurant"
      [busy]="toggling()"
      [menuSummary]="menuSummary()"
      (openChange)="changeOpening($event)"
    />
  } @else if (current.status === 'missing') {
    <div class="mt-6 grid gap-6 lg:grid-cols-5 lg:items-start">
      <app-registration-steps class="block lg:order-last lg:col-span-2" />

      <form
        class="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6 lg:col-span-3"
        aria-labelledby="registration-title"
        [formGroup]="form"
        (ngSubmit)="register()"
      >
        <h2 id="registration-title" class="text-lg font-extrabold">Datos del restaurante</h2>

        @let nameError = errorOf('name');
        <app-form-field label="Nombre del restaurante" fieldId="name" [error]="nameError">
          <input
            appTextInput
            id="name"
            formControlName="name"
            autocomplete="organization"
            placeholder="La Casona"
            [attr.aria-invalid]="nameError !== null"
          />
        </app-form-field>

        @let descriptionError = errorOf('description');
        <app-form-field
          label="Descripción (opcional)"
          fieldId="description"
          hint="Cuéntales qué cocinas, en hasta 300 caracteres."
          [error]="descriptionError"
        >
          <div class="grid gap-1">
            <textarea
              appTextInput
              id="description"
              rows="3"
              class="field-sizing-content min-h-28 resize-none"
              formControlName="description"
              placeholder="Comida criolla casera, con almuerzos del día."
              [attr.aria-invalid]="descriptionError !== null"
            ></textarea>
            <p
              aria-hidden="true"
              class="text-right text-xs font-semibold"
              [class.text-danger]="descriptionLength() > descriptionLimit"
              [class.text-muted]="descriptionLength() <= descriptionLimit"
            >
              {{ descriptionLength() }}/{{ descriptionLimit }}
            </p>
          </div>
        </app-form-field>

        @let addressError = errorOf('address');
        <app-form-field
          label="Dirección"
          fieldId="address"
          hint="Donde tus clientes retiran sus pedidos."
          [error]="addressError"
        >
          <input
            appTextInput
            id="address"
            formControlName="address"
            autocomplete="off"
            placeholder="Calle Sucre 245, zona Centro"
            [attr.aria-invalid]="addressError !== null"
          />
        </app-form-field>

        @if (formAlert(); as alert) {
          <app-alert class="block">{{ alert }}</app-alert>
        }

        <button appButton type="submit" [attr.aria-disabled]="submitting()">
          @if (submitting()) {
            <app-spinner />
            Registrando…
          } @else {
            Registrar restaurante
          }
        </button>
      </form>
    </div>
  } @else if (current.status === 'failed') {
    <app-load-error
      class="mt-6 block max-w-2xl"
      heading="No pudimos cargar tu restaurante"
      [message]="current.message"
      (retry)="retry()"
    />
  } @else {
    <div
      class="mt-6 max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm"
      role="status"
    >
      <span class="sr-only">Cargando tu restaurante…</span>
      <div appSkeleton class="h-24 sm:h-28"></div>
      <div class="grid gap-3 px-5 pb-6 sm:px-6">
        <div appSkeleton class="-mt-9 size-18 rounded-2xl border-4 border-surface"></div>
        <div appSkeleton class="mt-1 h-6 w-56 max-w-full rounded"></div>
        <div appSkeleton class="h-4 w-72 max-w-full rounded"></div>
        <div appSkeleton class="h-4 w-44 max-w-full rounded"></div>
      </div>
      <div class="flex items-center justify-between gap-4 border-t border-line px-5 py-5 sm:px-6">
        <div class="grid min-w-0 flex-1 grid-cols-1 gap-2">
          <div appSkeleton class="h-4 w-32 rounded"></div>
          <div appSkeleton class="h-3.5 w-64 max-w-full rounded"></div>
        </div>
        <div appSkeleton class="h-11 w-18 shrink-0 rounded-full"></div>
      </div>
    </div>
  }
</section>
```

## Rutas de la feature

Cada ruta lleva su `title`.

`frontend/src/app/features/restaurant-admin/restaurant-admin.routes.ts`

```ts
import { Routes } from '@angular/router';
import { CatalogPage } from './pages/catalog-page/catalog-page';
import { MyRestaurantPage } from './pages/my-restaurant-page/my-restaurant-page';
import { OrdersPage } from './pages/orders-page/orders-page';

export const RESTAURANT_ADMIN_ROUTES: Routes = [
  { path: '', component: MyRestaurantPage, title: 'Mi restaurante | Pedidos' },
  { path: 'menu', component: CatalogPage, title: 'Tu menú | Pedidos' },
  { path: 'pedidos', component: OrdersPage, title: 'Pedidos del restaurante | Pedidos' },
];
```

## Registro en las rutas de la app

La feature se carga con `loadChildren` bajo una ruta en español. Los segmentos que también usa el header viven en `@core/auth/auth-paths`, y el rol se exige con `roleGuard`.

`frontend/src/app/app.routes.ts` (recortado: solo la entrada de la feature)

```ts
{
  path: MY_RESTAURANT_SEGMENT,
  canActivate: [roleGuard('OWNER')],
  loadChildren: () =>
    import('@features/restaurant-admin/restaurant-admin.routes').then(
      (m) => m.RESTAURANT_ADMIN_ROUTES,
    ),
},
```

## Test de funciones puras

Sin `TestBed`: se llama a la función y se revisa el texto. Cuando varios casos siguen la misma regla, `it.each` los recorre (`shared/utils/restaurant-status.spec.ts`).

`frontend/src/app/features/restaurant-admin/models/restaurant-status.spec.ts`

```ts
import { openingDone, openingHint, openingProgress } from './restaurant-status';

describe('the opening copy', () => {
  it('explains what each state means for the customers', () => {
    expect(openingHint(true)).toContain('ya pueden hacer pedidos');
    expect(openingHint(false)).toContain('no pueden pedir');
  });

  it('says what is happening while the change is on its way', () => {
    expect(openingProgress(true)).toBe('Abriendo tu restaurante…');
    expect(openingProgress(false)).toBe('Cerrando tu restaurante…');
  });

  it('confirms the change with the name of the restaurant', () => {
    expect(openingDone(true, 'La Casona')).toBe('Abriste La Casona. Ya recibe pedidos.');
    expect(openingDone(false, 'La Casona')).toBe(
      'Cerraste La Casona. Ya no recibe pedidos nuevos.',
    );
  });
});
```

## Test del componente de presentación

Un componente `Host` le pasa los inputs con señales y guarda lo que emite. Se revisa lo que ve el usuario: texto, `aria-checked`, `aria-disabled`. Recortado: se muestran algunos de sus casos.

`frontend/src/app/features/restaurant-admin/components/restaurant-card/restaurant-card.spec.ts`

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Restaurant } from '../../models/restaurant';
import { RestaurantCard } from './restaurant-card';

const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: false,
  suspended: false,
};

@Component({
  imports: [RestaurantCard],
  template: `
    <app-restaurant-card
      [restaurant]="restaurant()"
      [busy]="busy()"
      [menuSummary]="menuSummary()"
      (openChange)="requested.push($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly restaurant = signal(LA_CASONA);
  readonly busy = signal(false);
  readonly menuSummary = signal<string | null>(null);
  readonly requested: boolean[] = [];
}

describe('RestaurantCard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function card(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (card().textContent ?? '').replace(/\s+/g, ' ');
  }

  function toggle(): HTMLButtonElement | null {
    return card().querySelector('button[role="switch"]');
  }

  function status(): string {
    return card().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  async function show(changes: Partial<Restaurant>, busy = false): Promise<void> {
    host.restaurant.set({ ...LA_CASONA, ...changes });
    host.busy.set(busy);
    await fixture.whenStable();
  }

  it('shows a closed restaurant with the switch off', () => {
    expect(status()).toBe('Cerrado');
    expect(toggle()?.getAttribute('aria-checked')).toBe('false');
    expect(text()).toContain('Cerrado: los clientes lo ven, pero no pueden pedir.');
  });

  it('asks to open a closed restaurant', () => {
    toggle()?.click();

    expect(host.requested).toEqual([true]);
  });

  it('says what is happening and asks nothing while a change is on its way', async () => {
    await show({ open: false }, true);

    toggle()?.click();

    expect(toggle()?.getAttribute('aria-disabled')).toBe('true');
    expect(toggle()?.getAttribute('aria-checked')).toBe('false');
    expect(text()).toContain('Abriendo tu restaurante…');
    expect(host.requested).toEqual([]);
  });

  it('explains a suspended restaurant and offers no switch', async () => {
    await show({ suspended: true });

    expect(status()).toBe('Suspendido');
    expect(toggle()).toBeNull();
    expect(text()).toContain('Tu restaurante está suspendido');
    expect(text()).toContain('Habla con el administrador para reactivarlo.');
  });
});
```

## Test de la página

`HttpTestingController` responde cada pedido, así el test recorre los cuatro estados, lo que se envía, lo que se ve mientras trabaja, cada error del backend y adónde va el foco. Los helpers (`showRestaurant`, `failWith`, `button`) dejan cada caso en pocas líneas. Recortado: se muestran algunos casos de cada bloque.

`frontend/src/app/features/restaurant-admin/pages/my-restaurant-page/my-restaurant-page.spec.ts`

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Catalog } from '../../models/catalog';
import { Restaurant } from '../../models/restaurant';
import { MyRestaurantPage } from './my-restaurant-page';

const MINE_URL = '/api/v1/restaurants/mine';
const REGISTER_URL = '/api/v1/restaurants';
const OPEN_URL = '/api/v1/restaurants/mine/open';
const MENU_URL = '/api/v1/restaurants/mine/catalog';
const MENU: Catalog = {
  categories: [
    {
      id: 3,
      name: 'Platos fuertes',
      products: [
        {
          id: 10,
          categoryId: 3,
          name: 'Silpancho',
          description: null,
          price: 45,
          available: true,
        },
      ],
    },
  ],
};
const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: false,
  suspended: false,
};

describe('MyRestaurantPage', () => {
  let fixture: ComponentFixture<MyRestaurantPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyRestaurantPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function heading(): HTMLElement {
    return page().querySelector('h1') as HTMLElement;
  }

  function field(id: string): HTMLInputElement | HTMLTextAreaElement {
    return page().querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement;
  }

  function messageOf(id: string): string {
    return page().querySelector(`#${id}-message`)?.textContent?.trim() ?? '';
  }

  function submitButton(): HTMLButtonElement {
    return page().querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  function toggle(): HTMLButtonElement {
    return page().querySelector('button[role="switch"]') as HTMLButtonElement;
  }

  function status(): string {
    return page().querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(page().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  function fill(id: string, value: string): void {
    field(id).value = value;
    field(id).dispatchEvent(new Event('input'));
    field(id).dispatchEvent(new Event('blur'));
  }

  function failWith(url: string, status: number, code?: string, extra: object = {}): void {
    httpTesting
      .expectOne(url)
      .flush(
        { status, detail: 'Detalle del servidor', code, ...extra },
        { status, statusText: 'Error' },
      );
  }

  async function showMissing(): Promise<void> {
    failWith(MINE_URL, 404, 'restaurant.not_found');
    await fixture.whenStable();
  }

  async function showRestaurant(changes: Partial<Restaurant> = {}): Promise<void> {
    httpTesting.expectOne(MINE_URL).flush({ ...LA_CASONA, ...changes });
    await fixture.whenStable();
    httpTesting.expectOne(MENU_URL).flush(MENU);
    await fixture.whenStable();
  }

  async function submitValidForm(): Promise<void> {
    fill('name', 'La Casona');
    fill('description', 'Comida criolla casera');
    fill('address', 'Calle Sucre 245');
    submitButton().click();
    await fixture.whenStable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the restaurant loads', async () => {
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Cargando tu restaurante',
      );

      await showRestaurant();

      expect(page().querySelector('[role="status"]')).toBeNull();
    });

    it('offers the registration form when the owner has no restaurant yet', async () => {
      await showMissing();

      expect(heading().textContent).toContain('Registra tu restaurante');
      expect(text()).toContain('Cómo funciona');
      expect(text()).toContain('Empieza cerrado');
      expect(field('name').value).toBe('');
      expect(submitButton().textContent?.trim()).toBe('Registrar restaurante');
      expect(page().querySelector('[role="alert"]')).toBeNull();
    });

    it('explains that the restaurant could not load and loads it again', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu restaurante',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');
      expect(page().querySelector('form')).toBeNull();

      button('Reintentar').click();
      await showRestaurant();

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(page().querySelector('h2')?.textContent).toContain('La Casona');
    });

    it('takes the focus to retry when loading again fails', async () => {
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      button('Reintentar').click();
      failWith(MINE_URL, 500);
      await fixture.whenStable();

      expect(document.activeElement).toBe(button('Reintentar'));
    });
  });

  describe('the registration', () => {
    beforeEach(showMissing);

    it('asks for the missing fields without calling the API', async () => {
      submitButton().click();
      await fixture.whenStable();

      httpTesting.expectNone(REGISTER_URL);
      expect(messageOf('name')).toBe('Escribe el nombre de tu restaurante.');
      expect(messageOf('address')).toBe('Escribe dónde queda tu restaurante.');
      expect(messageOf('description')).toBe('Cuéntales qué cocinas, en hasta 300 caracteres.');
      expect(document.activeElement?.id).toBe('name');
    });

    it('sends the registration once and shows that it is working', async () => {
      await submitValidForm();
      submitButton().click();

      const request = httpTesting.expectOne(REGISTER_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        name: 'La Casona',
        description: 'Comida criolla casera',
        address: 'Calle Sucre 245',
      });
      expect(submitButton().getAttribute('aria-disabled')).toBe('true');
      expect(submitButton().textContent).toContain('Registrando…');
      request.flush(LA_CASONA, { status: 201, statusText: 'Created' });
    });

    it('marks the fields rejected by the backend validation', async () => {
      await submitValidForm();
      failWith(REGISTER_URL, 400, 'validation_failed', {
        errors: [{ field: 'address', message: 'no debe estar vacío' }],
      });
      await fixture.whenStable();

      expect(messageOf('address')).toBe('no debe estar vacío');
      expect(document.activeElement?.id).toBe('address');
      expect(page().querySelector('form [role="alert"]')?.textContent).toContain(
        'Revisa los datos marcados',
      );
      expect(submitButton().getAttribute('aria-disabled')).toBe('false');
    });
  });

  describe('opening and closing', () => {
    it('opens a closed restaurant and says so', async () => {
      await showRestaurant();

      toggle().click();
      await fixture.whenStable();

      const request = httpTesting.expectOne(OPEN_URL);
      expect(request.request.method).toBe('POST');
      expect(toggle().getAttribute('aria-disabled')).toBe('true');
      expect(text()).toContain('Abriendo tu restaurante…');
      request.flush(null, { status: 204, statusText: 'No Content' });
      await fixture.whenStable();

      expect(status()).toBe('Abierto');
      expect(toggle().getAttribute('aria-checked')).toBe('true');
      expect(toggle().getAttribute('aria-disabled')).toBe('false');
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Abriste La Casona. Ya recibe pedidos.',
      );
    });

    it('keeps the restaurant as it was when the change fails', async () => {
      await showRestaurant();

      toggle().click();
      failWith(OPEN_URL, 500);
      await fixture.whenStable();

      expect(status()).toBe('Cerrado');
      expect(toggle().getAttribute('aria-checked')).toBe('false');
      expect(toggle().getAttribute('aria-disabled')).toBe('false');
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');
    });
  });
});
```

## Otros patrones de la feature

| Patrón                                              | Dónde verlo                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Formulario en el lugar y foco de vuelta al cerrarlo | `CatalogPage` con `CategoryForm` y `ProductForm`                                                     |
| Confirmar una acción dentro de la fila              | `ProductRow` y `CategoryHeader` con `app-confirm-panel`                                              |
| Una sola pregunta abierta a la vez                  | `ModerationControl` con `ModerationList` (admin) y `MenuItem` (menú público), con `ConfirmationSlot` |
| Interruptor que dice qué está haciendo              | `ProductRow` ("Marcando como agotado…")                                                              |
| Cambios de una lista en funciones puras             | `models/catalog.ts` (`addCategory`, `putProduct`) y su spec                                          |
| Un dato secundario que no muestra error propio      | El resumen del menú en `MyRestaurantPage` (`loadMenu`)                                               |
| Precio escrito con coma o punto                     | `models/price.ts` (`parsePrice`, `priceValidator`) en `ProductForm`                                  |
| Lista paginada                                      | `AccountListPage` en `features/admin`, con `app-pagination` y `ModerationList`                       |
| Lista pública en grilla y página de detalle         | `RestaurantListPage` y `RestaurantMenuPage` en `features/restaurants`                                |
