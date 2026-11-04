# Ejemplo de referencia: feature `restaurants`

Código verificado con `npm run lint`, `npm test` y `npm run build`. Muestra una página de lista con los cuatro estados, un componente de presentación, un cliente HTTP, un formulario que asocia los errores del backend a cada campo y sus tests.

El helper `toProblemDetails` que usan las páginas ya existe en `src/app/core/http/problem-details.ts`.

## Modelo

`frontend/src/app/features/restaurants/models/restaurant.ts`

```ts
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  active: boolean;
}

export interface RegisterRestaurant {
  name: string;
  address: string;
}
```

## Cliente HTTP

`frontend/src/app/features/restaurants/data-access/restaurant-api.ts`

```ts
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { RegisterRestaurant, Restaurant } from '../models/restaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants`;

  list(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.baseUrl);
  }

  register(data: RegisterRestaurant): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.baseUrl, data);
  }
}
```

## Componente de presentación

`frontend/src/app/features/restaurants/components/restaurant-card/restaurant-card.ts`

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Restaurant } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-card',
  templateUrl: './restaurant-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantCard {
  readonly restaurant = input.required<Restaurant>();
  readonly selected = output<Restaurant>();
}
```

## Componente de presentación: template

`frontend/src/app/features/restaurants/components/restaurant-card/restaurant-card.html`

```html
<button
  type="button"
  class="w-full rounded-xl border border-line bg-surface p-4 text-left transition hover:shadow-md"
  (click)="selected.emit(restaurant())"
>
  <h3 class="font-semibold">{{ restaurant().name }}</h3>
  <p class="text-sm text-muted">{{ restaurant().address }}</p>
</button>
```

## Página de lista

`frontend/src/app/features/restaurants/pages/restaurant-list-page/restaurant-list-page.ts`

```ts
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails, toProblemDetails } from '@core/http/problem-details';
import { RestaurantCard } from '../../components/restaurant-card/restaurant-card';
import { RestaurantApi } from '../../data-access/restaurant-api';
import { Restaurant } from '../../models/restaurant';

@Component({
  selector: 'app-restaurant-list-page',
  imports: [RouterLink, RestaurantCard],
  templateUrl: './restaurant-list-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantListPage implements OnInit {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly router = inject(Router);

  protected readonly restaurants = signal<Restaurant[]>([]);
  protected readonly loading = signal(true);
  protected readonly problem = signal<ProblemDetails | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.problem.set(null);
    this.restaurantApi.list().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.problem.set(toProblemDetails(error));
        this.loading.set(false);
      },
    });
  }

  protected open(restaurant: Restaurant): void {
    this.router.navigate(['/restaurantes', restaurant.id]);
  }
}
```

## Página de lista: template con los cuatro estados

`frontend/src/app/features/restaurants/pages/restaurant-list-page/restaurant-list-page.html`

```html
<section class="mx-auto max-w-3xl px-4 py-8">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold">Restaurantes</h1>
    <a routerLink="nuevo" class="font-semibold text-brand">Registrar restaurante</a>
  </div>

  @if (loading()) {
    <div class="grid gap-3" role="status" aria-label="Cargando restaurantes">
      @for (placeholder of [1, 2, 3]; track placeholder) {
        <div class="h-20 animate-pulse rounded-xl bg-line"></div>
      }
    </div>
  } @else if (problem(); as problem) {
    <div class="rounded-xl bg-danger-soft p-4 text-danger" role="alert">
      <p>{{ problem.detail }}</p>
      <button type="button" class="mt-2 font-semibold underline" (click)="load()">
        Reintentar
      </button>
    </div>
  } @else {
    <ul class="grid gap-3">
      @for (restaurant of restaurants(); track restaurant.id) {
        <li>
          <app-restaurant-card [restaurant]="restaurant" (selected)="open($event)" />
        </li>
      } @empty {
        <li class="rounded-xl border border-dashed border-line p-6 text-center text-muted">
          Todavía no hay restaurantes. Registra el primero para empezar a recibir pedidos.
        </li>
      }
    </ul>
  }
</section>
```

## Página de formulario

`frontend/src/app/features/restaurants/pages/register-restaurant-page/register-restaurant-page.ts`

```ts
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProblemDetails, toProblemDetails } from '@core/http/problem-details';
import { RestaurantApi } from '../../data-access/restaurant-api';

@Component({
  selector: 'app-register-restaurant-page',
  imports: [ReactiveFormsModule],
  templateUrl: './register-restaurant-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterRestaurantPage {
  private readonly restaurantApi = inject(RestaurantApi);
  private readonly router = inject(Router);

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
  });
  protected readonly saving = signal(false);
  protected readonly problem = signal<ProblemDetails | null>(null);

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.problem.set(null);
    this.restaurantApi.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/restaurantes']),
      error: (error: unknown) => {
        const problem = toProblemDetails(error);
        for (const { field, message } of problem.errors ?? []) {
          this.form.get(field)?.setErrors({ server: message });
        }
        this.problem.set(problem);
        this.saving.set(false);
      },
    });
  }
}
```

## Página de formulario: template

`frontend/src/app/features/restaurants/pages/register-restaurant-page/register-restaurant-page.html`

```html
<section class="mx-auto max-w-md px-4 py-8">
  <h1 class="mb-6 text-2xl font-bold">Registrar restaurante</h1>

  <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
    <div class="grid gap-1">
      <label for="name" class="font-medium">Nombre</label>
      <input id="name" formControlName="name" class="rounded-lg border border-line px-3 py-2" />
      @if (form.controls.name.touched && form.controls.name.errors; as errors) {
        <p class="text-sm text-danger">
          {{ errors['server'] ?? 'Ingresa un nombre de hasta 120 caracteres.' }}
        </p>
      }
    </div>

    <div class="grid gap-1">
      <label for="address" class="font-medium">Dirección</label>
      <input
        id="address"
        formControlName="address"
        class="rounded-lg border border-line px-3 py-2"
      />
      @if (form.controls.address.touched && form.controls.address.errors; as errors) {
        <p class="text-sm text-danger">
          {{ errors['server'] ?? 'Ingresa una dirección de hasta 200 caracteres.' }}
        </p>
      }
    </div>

    @if (problem(); as problem) {
      <p class="rounded-lg bg-danger-soft p-3 text-danger" role="alert">{{ problem.detail }}</p>
    }

    <button
      type="submit"
      class="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
      [disabled]="saving()"
    >
      {{ saving() ? 'Registrando...' : 'Registrar' }}
    </button>
  </form>
</section>
```

## Rutas de la feature

`frontend/src/app/features/restaurants/restaurants.routes.ts`

```ts
import { Routes } from '@angular/router';
import { RegisterRestaurantPage } from './pages/register-restaurant-page/register-restaurant-page';
import { RestaurantListPage } from './pages/restaurant-list-page/restaurant-list-page';

export const RESTAURANTS_ROUTES: Routes = [
  { path: '', component: RestaurantListPage, title: 'Restaurantes | Pedidos' },
  { path: 'nuevo', component: RegisterRestaurantPage, title: 'Registrar restaurante | Pedidos' },
];
```

## Test de la página de lista

`frontend/src/app/features/restaurants/pages/restaurant-list-page/restaurant-list-page.spec.ts`

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RestaurantListPage } from './restaurant-list-page';

describe('RestaurantListPage', () => {
  let fixture: ComponentFixture<RestaurantListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RestaurantListPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestaurantListPage);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows a loading placeholder while the request is pending', () => {
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();

    httpTesting.expectOne('/api/v1/restaurants').flush([]);
  });

  it('lists the restaurants returned by the API', async () => {
    httpTesting
      .expectOne('/api/v1/restaurants')
      .flush([{ id: 1, name: 'La Casona', address: 'Calle Sucre 245', active: true }]);
    await fixture.whenStable();

    expect(text()).toContain('La Casona');
  });

  it('explains what to do when there are no restaurants', async () => {
    httpTesting.expectOne('/api/v1/restaurants').flush([]);
    await fixture.whenStable();

    expect(text()).toContain('Todavía no hay restaurantes');
  });

  it('shows the problem detail and lets the user retry when the request fails', async () => {
    httpTesting
      .expectOne('/api/v1/restaurants')
      .flush({ status: 500, detail: 'Error interno' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Error interno',
    );
  });
});
```

## Test de la página de formulario

`frontend/src/app/features/restaurants/pages/register-restaurant-page/register-restaurant-page.spec.ts`

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RegisterRestaurantPage } from './register-restaurant-page';

describe('RegisterRestaurantPage', () => {
  let fixture: ComponentFixture<RegisterRestaurantPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RegisterRestaurantPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RegisterRestaurantPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function fill(id: string, value: string): void {
    const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
  }

  it('does not call the API while the form is invalid', async () => {
    submit();
    await fixture.whenStable();

    httpTesting.expectNone('/api/v1/restaurants');
    expect(fixture.nativeElement.textContent).toContain('Ingresa un nombre');
  });

  it('sends the restaurant to the API', () => {
    fill('name', 'La Casona');
    fill('address', 'Calle Sucre 245');
    submit();

    const request = httpTesting.expectOne('/api/v1/restaurants');
    expect(request.request.body).toEqual({ name: 'La Casona', address: 'Calle Sucre 245' });
    request.flush({ id: 1, name: 'La Casona', address: 'Calle Sucre 245', active: true });
  });

  it('shows the validation errors returned by the backend next to each field', async () => {
    fill('name', 'La Casona');
    fill('address', 'Calle Sucre 245');
    submit();

    httpTesting.expectOne('/api/v1/restaurants').flush(
      {
        status: 400,
        detail: 'Datos inválidos',
        code: 'validation_failed',
        errors: [{ field: 'name', message: 'Ya existe un restaurante con ese nombre' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Ya existe un restaurante con ese nombre');
  });
});
```

## Registro en las rutas de la app

`frontend/src/app/app.routes.ts`

```ts
{
  path: 'restaurantes',
  loadChildren: () =>
    import('@features/restaurants/restaurants.routes').then((m) => m.RESTAURANTS_ROUTES),
},
```
