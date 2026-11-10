import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { Restaurant } from '../../models/restaurant';
import { RestaurantListPage } from './restaurant-list-page';

const LIST_URL = '/api/v1/restaurants';
const LA_CASONA: Restaurant = {
  id: 4,
  name: 'La Casona',
  description: 'Comida criolla casera',
  address: 'Calle Sucre 245',
  open: true,
};
const EL_FOGON: Restaurant = {
  id: 7,
  name: 'El Fogón',
  description: null,
  address: 'Av. Banzer 120',
  open: false,
};

function pageOf(
  items: Restaurant[],
  page = 0,
  totalItems = items.length,
  totalPages = Math.ceil(totalItems / 12),
): Page<Restaurant> {
  return { items, page, size: 12, totalItems, totalPages };
}

describe('RestaurantListPage', () => {
  let fixture: ComponentFixture<RestaurantListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RestaurantListPage);
    await fixture.whenStable();
  });

  afterEach(() => httpTesting.verify());

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function names(): string[] {
    return Array.from(page().querySelectorAll('li h2'), (name) => name.textContent?.trim() ?? '');
  }

  function list(): HTMLElement | null {
    return page().querySelector('ul');
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

  function expectPage(pageNumber: number) {
    const request = httpTesting.expectOne(
      (candidate) => candidate.url === LIST_URL && candidate.params.get('page') === `${pageNumber}`,
    );
    expect(request.request.params.get('size')).toBe('12');
    return request;
  }

  async function respond(result: Page<Restaurant>): Promise<void> {
    expectPage(result.page).flush(result);
    await fixture.whenStable();
  }

  async function fail(pageNumber: number, status = 500): Promise<void> {
    expectPage(pageNumber).flush(
      { status, detail: 'Detalle del servidor' },
      { status, statusText: 'Error' },
    );
    await fixture.whenStable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the restaurants load', async () => {
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Cargando restaurantes',
      );

      await respond(pageOf([LA_CASONA]));

      expect(page().querySelector('[role="status"]')).toBeNull();
    });

    it('shows a tile for each restaurant in the order of the API', async () => {
      await respond(pageOf([LA_CASONA, EL_FOGON]));

      expect(names()).toEqual(['La Casona', 'El Fogón']);
      expect(page().querySelector('[data-total]')?.textContent).toContain('2 restaurantes');
      expect(page().querySelector('a[href="/7"]')).toBeTruthy();
    });

    it('tells open and closed restaurants apart', async () => {
      await respond(pageOf([LA_CASONA, EL_FOGON]));

      const statuses = Array.from(page().querySelectorAll('li'), (tile) =>
        tile.querySelector('[data-status]')?.textContent?.trim(),
      );
      expect(statuses).toEqual(['Abierto', 'Cerrado']);
    });

    it('explains that there are no restaurants yet', async () => {
      await respond(pageOf([]));

      expect(text()).toContain('Todavía no hay restaurantes');
      expect(list()).toBeNull();
      expect(page().querySelector('[data-total]')).toBeNull();
    });

    it('explains that the restaurants could not load and loads them again', async () => {
      await fail(0);

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar los restaurantes',
      );
      expect(page().querySelector('[role="alert"]')?.textContent).toContain('Detalle del servidor');

      button('Reintentar').click();
      await respond(pageOf([LA_CASONA]));

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(names()).toEqual(['La Casona']);
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      await fail(0);
      const retry = button('Reintentar');
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
      await respond(pageOf([LA_CASONA]));

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(names()).toEqual(['La Casona']);
    });

    it('explains that the server cannot be reached', async () => {
      expectPage(0).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain('No hay conexión');
    });

    it('cancels the request when the customer leaves before it answers', () => {
      fixture.destroy();

      expect(expectPage(0).cancelled).toBe(true);
    });

    it('leaves the focus alone when the page is the first one opened', async () => {
      await respond(pageOf([LA_CASONA]));

      expect(document.activeElement).not.toBe(page().querySelector('h1'));
    });
  });

  describe('the pages', () => {
    const MANY = 30;

    it('offers no pagination when everything fits in one page', async () => {
      await respond(pageOf([LA_CASONA, EL_FOGON]));

      expect(page().querySelector('app-pagination')).toBeNull();
    });

    it('goes to the next page keeping the current one in view meanwhile', async () => {
      await respond(pageOf([LA_CASONA], 0, MANY));

      button('Siguiente').click();
      await fixture.whenStable();

      const request = expectPage(1);
      expect(names()).toEqual(['La Casona']);
      expect(list()?.getAttribute('aria-busy')).toBe('true');
      expect(button('Siguiente').getAttribute('aria-disabled')).toBe('true');
      request.flush(pageOf([EL_FOGON], 1, MANY));
      await fixture.whenStable();

      expect(names()).toEqual(['El Fogón']);
      expect(list()?.getAttribute('aria-busy')).toBe('false');
      expect(text()).toContain('Página 2 de 3');
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('sends a single request when the customer insists', async () => {
      await respond(pageOf([LA_CASONA], 0, MANY));

      button('Siguiente').click();
      await fixture.whenStable();
      button('Siguiente').click();
      await fixture.whenStable();

      expectPage(1).flush(pageOf([EL_FOGON], 1, MANY));
      httpTesting.expectNone((candidate) => candidate.params.get('page') === '2');
    });

    it('takes the focus to retry when a page cannot load', async () => {
      await respond(pageOf([LA_CASONA], 0, MANY));

      button('Siguiente').click();
      await fail(1);

      expect(document.activeElement).toBe(button('Reintentar'));

      button('Reintentar').click();
      await respond(pageOf([EL_FOGON], 1, MANY));

      expect(names()).toEqual(['El Fogón']);
    });

    it('moves to the last page when the requested one is left empty', async () => {
      await respond(pageOf([LA_CASONA], 0, MANY));
      button('Siguiente').click();
      await respond(pageOf([EL_FOGON], 1, MANY));
      button('Siguiente').click();
      await fixture.whenStable();

      expectPage(2).flush(pageOf([], 2, 20, 2));
      await fixture.whenStable();
      await respond(pageOf([EL_FOGON], 1, 20, 2));

      expect(names()).toEqual(['El Fogón']);
      expect(text()).toContain('Página 2 de 2');
      expect(text()).not.toContain('Todavía no hay restaurantes');
    });
  });
});
