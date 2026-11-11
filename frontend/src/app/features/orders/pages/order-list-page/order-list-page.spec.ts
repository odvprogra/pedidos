import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { Announcer } from '@shared/ui/live-region/announcer';
import { Order } from '../../models/order';
import { OrderListPage } from './order-list-page';

const LIST_URL = '/api/v1/orders';

function order(id: number, restaurantName: string, status: Order['status']): Order {
  return {
    id,
    restaurantId: 4,
    restaurantName,
    status,
    total: 90,
    placedAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:00:00Z',
    items: [{ productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 }],
  };
}

const NEWEST = order(43, 'El Fogón', 'PLACED');
const OLDER = order(42, 'La Casona', 'PICKED_UP');

function pageOf(
  items: Order[],
  page = 0,
  totalItems = items.length,
  totalPages = Math.ceil(totalItems / 10),
): Page<Order> {
  return { items, page, size: 10, totalItems, totalPages };
}

describe('OrderListPage', () => {
  let fixture: ComponentFixture<OrderListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OrderListPage);
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

  function titles(): string[] {
    return Array.from(page().querySelectorAll('li h2'), (title) =>
      (title.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
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
    expect(request.request.params.get('size')).toBe('10');
    return request;
  }

  async function respond(result: Page<Order>): Promise<void> {
    expectPage(result.page).flush(result);
    await fixture.whenStable();
  }

  async function fail(pageNumber: number): Promise<void> {
    expectPage(pageNumber).flush(
      { status: 500, detail: 'Detalle del servidor' },
      { status: 500, statusText: 'Error' },
    );
    await fixture.whenStable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the orders load', async () => {
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando tus pedidos…']);

      await respond(pageOf([NEWEST]));

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows each order in the order of the API with its status', async () => {
      await respond(pageOf([NEWEST, OLDER]));

      expect(titles()).toEqual(['Pedido #43 · El Fogón', 'Pedido #42 · La Casona']);
      const statuses = Array.from(page().querySelectorAll('li [data-status]'), (status) =>
        status.textContent?.trim(),
      );
      expect(statuses).toEqual(['Pendiente', 'Retirado']);
      expect(page().querySelector('[data-total-orders]')?.textContent).toContain('2 pedidos');
    });

    it('explains that there are no orders yet and offers the restaurants', async () => {
      await respond(pageOf([]));

      expect(text()).toContain('Todavía no hiciste pedidos');
      const link = page().querySelector('a') as HTMLAnchorElement;
      expect(link.textContent?.trim()).toBe('Ver restaurantes');
      expect(link.getAttribute('href')).toBe('/restaurantes');
      expect(list()).toBeNull();
      expect(page().querySelector('[data-total-orders]')).toBeNull();
    });

    it('explains that the orders could not load and loads them again', async () => {
      await fail(0);

      const alert = page().querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('No pudimos cargar tus pedidos');
      expect(alert?.textContent).toContain('Detalle del servidor');

      button('Reintentar').click();
      await respond(pageOf([NEWEST]));

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(titles()).toEqual(['Pedido #43 · El Fogón']);
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
        'No pudimos cargar tus pedidos',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await respond(pageOf([NEWEST]));

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(titles()).toEqual(['Pedido #43 · El Fogón']);
    });

    it('keeps retrying in view when the page it retries is empty now', async () => {
      await respond(pageOf([NEWEST], 0, 15));
      button('Siguiente').click();
      await fixture.whenStable();
      await fail(1);
      const retry = button('Reintentar');
      retry.focus();

      retry.click();
      await fixture.whenStable();
      expectPage(1).flush(pageOf([], 1, 5, 1));
      await fixture.whenStable();

      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await respond(pageOf([NEWEST]));

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(titles()).toEqual(['Pedido #43 · El Fogón']);
    });

    it('cancels the request when the customer leaves before it answers', () => {
      fixture.destroy();

      expect(expectPage(0).cancelled).toBe(true);
    });
  });

  describe('the pages', () => {
    const MANY = 25;

    it('offers no pagination when everything fits in one page', async () => {
      await respond(pageOf([NEWEST, OLDER]));

      expect(page().querySelector('app-pagination')).toBeNull();
    });

    it('goes to the next page keeping the current one in view meanwhile', async () => {
      await respond(pageOf([NEWEST], 0, MANY));

      button('Siguiente').click();
      await fixture.whenStable();

      const request = expectPage(1);
      expect(titles()).toEqual(['Pedido #43 · El Fogón']);
      expect(list()?.getAttribute('aria-busy')).toBe('true');
      expect(button('Siguiente').getAttribute('aria-disabled')).toBe('true');
      request.flush(pageOf([OLDER], 1, MANY));
      await fixture.whenStable();

      expect(titles()).toEqual(['Pedido #42 · La Casona']);
      expect(list()?.getAttribute('aria-busy')).toBe('false');
      expect(text()).toContain('Página 2 de 3');
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('takes the focus to retry when a page cannot load', async () => {
      await respond(pageOf([NEWEST], 0, MANY));

      button('Siguiente').click();
      await fail(1);

      expect(document.activeElement).toBe(button('Reintentar'));
    });

    it('moves to the last page when the requested one is left empty', async () => {
      await respond(pageOf([NEWEST], 0, MANY));
      button('Siguiente').click();
      await respond(pageOf([OLDER], 1, MANY));
      button('Siguiente').click();
      await fixture.whenStable();

      expectPage(2).flush(pageOf([], 2, 15, 2));
      await fixture.whenStable();
      await respond(pageOf([OLDER], 1, 15, 2));

      expect(titles()).toEqual(['Pedido #42 · La Casona']);
      expect(text()).toContain('Página 2 de 2');
    });
  });
});
