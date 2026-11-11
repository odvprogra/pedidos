import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { Announcer } from '@shared/ui/live-region/announcer';
import { RestaurantSummary } from '../../models/restaurant-summary';
import { RestaurantListPage } from './restaurant-list-page';

const LA_CASONA: RestaurantSummary = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla',
  address: 'Calle Sucre 245',
  open: true,
  suspended: false,
};
const EL_FOGON: RestaurantSummary = {
  id: 5,
  name: 'El Fogón',
  description: null,
  address: 'Av. Banzer 120',
  open: false,
  suspended: false,
};
const NAPOLI: RestaurantSummary = {
  id: 6,
  name: 'Pizzería Napoli',
  description: null,
  address: 'Calle Junín 30',
  open: false,
  suspended: true,
};
const FIRST_PAGE_URL = '/api/v1/admin/restaurants?page=0&size=20';
const SECOND_PAGE_URL = '/api/v1/admin/restaurants?page=1&size=20';

function pageOf(
  items: RestaurantSummary[],
  page = 0,
  totalItems = items.length,
): Page<RestaurantSummary> {
  return { items, page, size: 20, totalItems, totalPages: Math.ceil(totalItems / 20) };
}

describe('RestaurantListPage', () => {
  let fixture: ComponentFixture<RestaurantListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestaurantListPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function rows(): HTMLLIElement[] {
    return Array.from(page().querySelectorAll('ul > li'));
  }

  function rowOf(name: string): HTMLLIElement {
    const row = rows().find((candidate) => candidate.textContent?.includes(name));
    if (!row) {
      throw new Error(`No row shows ${name}`);
    }
    return row;
  }

  function statusOf(name: string): string {
    return rowOf(name).querySelector('[data-status]')?.textContent?.trim() ?? '';
  }

  function buttonIn(container: HTMLElement, label: string): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!button) {
      throw new Error(`No button says ${label}`);
    }
    return button;
  }

  async function show(result: Page<RestaurantSummary>): Promise<void> {
    httpTesting.expectOne(FIRST_PAGE_URL).flush(result);
    await fixture.whenStable();
  }

  async function confirm(name: string, action: string, confirmation: string): Promise<void> {
    buttonIn(rowOf(name), action).click();
    await fixture.whenStable();
    buttonIn(rowOf(name), confirmation).click();
    await fixture.whenStable();
  }

  function failWith(url: string, status: number, code?: string): void {
    httpTesting
      .expectOne(url)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
  }

  describe('the list', () => {
    it('shows a placeholder while the first page loads', async () => {
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando restaurantes…']);

      await show(pageOf([LA_CASONA]));

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows every restaurant with its address and status, the suspended ones included', async () => {
      await show(pageOf([LA_CASONA, EL_FOGON, NAPOLI]));

      expect(rows()).toHaveLength(3);
      expect(rowOf('La Casona').textContent).toContain('Calle Sucre 245');
      expect(statusOf('La Casona')).toBe('Abierto');
      expect(statusOf('El Fogón')).toBe('Cerrado');
      expect(statusOf('Pizzería Napoli')).toBe('Suspendido');
      expect(text()).toContain('3 restaurantes');
    });

    it('counts a single restaurant in singular', async () => {
      await show(pageOf([LA_CASONA]));

      expect(text()).toContain('1 restaurante');
      expect(text()).not.toContain('1 restaurantes');
    });

    it('offers to suspend an active restaurant and to reactivate a suspended one', async () => {
      await show(pageOf([LA_CASONA, EL_FOGON, NAPOLI]));

      expect(rowOf('La Casona').querySelector('button')?.textContent).toContain('Suspender');
      expect(rowOf('El Fogón').querySelector('button')?.textContent).toContain('Suspender');
      expect(rowOf('Pizzería Napoli').querySelector('button')?.textContent).toContain('Reactivar');
    });

    it('explains that there are no restaurants yet', async () => {
      await show(pageOf([]));

      expect(rows()).toHaveLength(0);
      expect(text()).toContain('Todavía no hay restaurantes');
      expect(text()).toContain('Cuando un dueño registre su restaurante');
    });

    it('explains that the list could not load and loads it again', async () => {
      failWith(FIRST_PAGE_URL, 500);
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar los restaurantes',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');

      buttonIn(page(), 'Reintentar').click();
      await show(pageOf([LA_CASONA]));

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(rows()).toHaveLength(1);
    });

    it('explains a list that the account is not allowed to see', async () => {
      failWith(FIRST_PAGE_URL, 403, 'access_denied');
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'Tu cuenta no tiene permiso para administrar restaurantes.',
      );
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      failWith(FIRST_PAGE_URL, 500);
      await fixture.whenStable();
      const retry = buttonIn(page(), 'Reintentar');
      retry.focus();

      retry.click();
      await fixture.whenStable();
      retry.click();

      expect(page().querySelector('app-load-error')?.textContent).toContain(
        'No pudimos cargar los restaurantes',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await show(pageOf([LA_CASONA]));

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(rows()).toHaveLength(1);
    });

    it('explains that the server cannot be reached', async () => {
      httpTesting.expectOne(FIRST_PAGE_URL).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });
  });

  describe('the pages', () => {
    it('hides the pages when everything fits in one', async () => {
      await show(pageOf([LA_CASONA, EL_FOGON]));

      expect(page().querySelector('nav[aria-label="Paginación"]')).toBeNull();
    });

    it('asks for the next page and keeps the current one visible meanwhile', async () => {
      await show(pageOf([LA_CASONA], 0, 45));
      expect(text()).toContain('Página 1 de 3');

      buttonIn(page(), 'Siguiente').click();
      await fixture.whenStable();

      const list = page().querySelector('[aria-busy]');
      expect(list?.getAttribute('aria-busy')).toBe('true');
      expect(rowOf('La Casona')).toBeTruthy();
      httpTesting.expectOne(SECOND_PAGE_URL).flush(pageOf([NAPOLI], 1, 45));
      await fixture.whenStable();

      expect(text()).toContain('Página 2 de 3');
      expect(rows().map((row) => row.textContent)).toEqual([
        expect.stringContaining('Pizzería Napoli'),
      ]);
      expect(list?.getAttribute('aria-busy')).toBe('false');
    });

    it('takes the focus to the top of the list once the new page arrives', async () => {
      await show(pageOf([LA_CASONA], 0, 45));

      buttonIn(page(), 'Siguiente').click();
      httpTesting.expectOne(SECOND_PAGE_URL).flush(pageOf([NAPOLI], 1, 45));
      await fixture.whenStable();

      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('takes the focus to retry when the new page fails and loads it again', async () => {
      await show(pageOf([LA_CASONA], 0, 45));
      buttonIn(page(), 'Siguiente').click();
      failWith(SECOND_PAGE_URL, 500);
      await fixture.whenStable();

      expect(document.activeElement).toBe(buttonIn(page(), 'Reintentar'));

      buttonIn(page(), 'Reintentar').click();
      httpTesting.expectOne(SECOND_PAGE_URL).flush(pageOf([NAPOLI], 1, 45));
      await fixture.whenStable();
      expect(rowOf('Pizzería Napoli')).toBeTruthy();
    });

    it('does not ask for another page while one is loading', async () => {
      await show(pageOf([LA_CASONA], 0, 45));

      buttonIn(page(), 'Siguiente').click();
      await fixture.whenStable();
      buttonIn(page(), 'Siguiente').click();

      httpTesting.expectOne(SECOND_PAGE_URL).flush(pageOf([NAPOLI], 1, 45));
    });
  });

  describe('the actions', () => {
    it('asks before suspending and sends nothing when the admin cancels', async () => {
      await show(pageOf([LA_CASONA]));

      buttonIn(rowOf('La Casona'), 'Suspender').click();
      await fixture.whenStable();

      expect(rowOf('La Casona').textContent).toContain('¿Suspender La Casona?');
      expect(rowOf('La Casona').textContent).toContain('Deja de aparecer para los clientes');

      buttonIn(rowOf('La Casona'), 'Cancelar').click();
      await fixture.whenStable();

      expect(rowOf('La Casona').textContent).not.toContain('¿Suspender');
      httpTesting.expectNone('/api/v1/restaurants/4/suspend');
    });

    it('keeps a single question open at a time', async () => {
      await show(pageOf([LA_CASONA, NAPOLI]));

      buttonIn(rowOf('La Casona'), 'Suspender').click();
      await fixture.whenStable();
      buttonIn(rowOf('Pizzería Napoli'), 'Reactivar').click();
      await fixture.whenStable();

      expect(page().querySelectorAll('ul [role="group"]')).toHaveLength(1);
      expect(rowOf('Pizzería Napoli').textContent).toContain('¿Reactivar Pizzería Napoli?');
      expect(rowOf('La Casona').textContent).not.toContain('¿Suspender');
      expect(buttonIn(rowOf('La Casona'), 'Suspender').getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(buttonIn(rowOf('Pizzería Napoli'), 'Cancelar'));
    });

    it('suspends the restaurant once the admin confirms and shows it closed', async () => {
      await show(pageOf([LA_CASONA]));

      await confirm('La Casona', 'Suspender', 'Sí, suspender');

      const request = httpTesting.expectOne('/api/v1/restaurants/4/suspend');
      expect(request.request.method).toBe('POST');
      expect(rowOf('La Casona').querySelector('button')?.textContent).toContain('Suspendiendo…');
      expect(rowOf('La Casona').querySelector('button')?.getAttribute('aria-disabled')).toBe(
        'true',
      );
      request.flush({ ...LA_CASONA, open: false, suspended: true });
      await fixture.whenStable();

      expect(statusOf('La Casona')).toBe('Suspendido');
      expect(rowOf('La Casona').querySelector('button')?.textContent).toContain('Reactivar');
      expect(announced()).toEqual(['Suspendiste La Casona. Ya no aparece para los clientes.']);
    });

    it('shows the restaurant as the server returns it after the reactivation', async () => {
      await show(pageOf([NAPOLI]));

      await confirm('Pizzería Napoli', 'Reactivar', 'Sí, reactivar');
      httpTesting
        .expectOne('/api/v1/restaurants/6/reactivate')
        .flush({ ...NAPOLI, open: false, suspended: false });
      await fixture.whenStable();

      expect(statusOf('Pizzería Napoli')).toBe('Cerrado');
      expect(rowOf('Pizzería Napoli').querySelector('button')?.textContent).toContain('Suspender');
      expect(announced()).toEqual([
        'Reactivaste Pizzería Napoli. El restaurante queda cerrado hasta que su dueño lo abra.',
      ]);
    });

    it('sends a single request when the admin insists', async () => {
      await show(pageOf([LA_CASONA]));

      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      buttonIn(rowOf('La Casona'), 'Suspendiendo…').click();
      await fixture.whenStable();

      expect(rowOf('La Casona').textContent).not.toContain('¿Suspender');
      httpTesting
        .expectOne('/api/v1/restaurants/4/suspend')
        .flush({ ...LA_CASONA, open: false, suspended: true });
    });

    it('keeps the other restaurants waiting while an action runs', async () => {
      await show(pageOf([LA_CASONA, NAPOLI]));

      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      const otherButton = buttonIn(rowOf('Pizzería Napoli'), 'Reactivar');
      otherButton.click();
      await fixture.whenStable();

      expect(otherButton.getAttribute('aria-disabled')).toBe('true');
      expect(rowOf('Pizzería Napoli').textContent).not.toContain('¿Reactivar');
      httpTesting
        .expectOne('/api/v1/restaurants/4/suspend')
        .flush({ ...LA_CASONA, open: false, suspended: true });
      await fixture.whenStable();
      expect(otherButton.getAttribute('aria-disabled')).toBe('false');
    });

    it.each([
      [404, 'restaurant.not_found', 'No encontramos ese restaurante.'],
      [403, 'access_denied', 'Tu cuenta no tiene permiso para administrar restaurantes.'],
      [403, 'csrf_invalid', 'No pudimos validar tu solicitud.'],
      [500, undefined, 'Detalle del servidor'],
    ])(
      'explains a %i %s answer and leaves the restaurant as it was',
      async (status, code, message) => {
        await show(pageOf([LA_CASONA]));

        await confirm('La Casona', 'Suspender', 'Sí, suspender');
        failWith('/api/v1/restaurants/4/suspend', status, code);
        await fixture.whenStable();

        expect(page().querySelector('[role="alert"]')?.textContent).toContain(message);
        expect(statusOf('La Casona')).toBe('Abierto');
        expect(buttonIn(rowOf('La Casona'), 'Suspender').getAttribute('aria-disabled')).toBe(
          'false',
        );
      },
    );

    it('announces the same failure again as a new notice', async () => {
      await show(pageOf([LA_CASONA]));
      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      failWith('/api/v1/restaurants/4/suspend', 500);
      await fixture.whenStable();
      const first = page().querySelector('app-alert[dismissible]');

      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      failWith('/api/v1/restaurants/4/suspend', 500);
      await fixture.whenStable();

      const second = page().querySelector('app-alert[dismissible]');
      expect(second?.textContent).toContain('Detalle del servidor');
      expect(second).not.toBe(first);
    });

    it('lets the admin close the message', async () => {
      await show(pageOf([LA_CASONA]));
      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      httpTesting
        .expectOne('/api/v1/restaurants/4/suspend')
        .flush({ ...LA_CASONA, open: false, suspended: true });
      await fixture.whenStable();

      (page().querySelector('button[aria-label="Cerrar aviso"]') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(page().querySelector('app-sticky-notice')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('clears the previous message when the admin changes the page', async () => {
      await show(pageOf([LA_CASONA], 0, 45));
      await confirm('La Casona', 'Suspender', 'Sí, suspender');
      httpTesting
        .expectOne('/api/v1/restaurants/4/suspend')
        .flush({ ...LA_CASONA, open: false, suspended: true });
      await fixture.whenStable();

      buttonIn(page(), 'Siguiente').click();
      await fixture.whenStable();

      expect(page().querySelector('[data-sticky-notice]')).toBeNull();
      httpTesting.expectOne(SECOND_PAGE_URL).flush(pageOf([NAPOLI], 1, 45));
    });
  });
});
