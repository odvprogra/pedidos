import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Page } from '@core/http/page';
import { Announcer } from '@shared/ui/live-region/announcer';
import { PlatformOrder } from '../../models/platform-order';
import { PlatformOrderListPage } from './platform-order-list-page';

const LIST_URL = '/api/v1/admin/orders';

function order(id: number, restaurantName: string, status: PlatformOrder['status']): PlatformOrder {
  return {
    id,
    restaurantId: 4,
    restaurantName,
    status,
    total: 100.5,
    placedAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:00:00Z',
    items: [
      { productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 },
      { productId: 11, productName: 'Limonada', unitPrice: 10.5, quantity: 1, subtotal: 10.5 },
    ],
  };
}

const NEWEST = order(43, 'El Fogón', 'IN_PREPARATION');
const OLDER = order(42, 'La Casona', 'PICKED_UP');

function pageOf(
  items: PlatformOrder[],
  page = 0,
  totalItems = items.length,
  totalPages = Math.ceil(totalItems / 20),
): Page<PlatformOrder> {
  return { items, page, size: 20, totalItems, totalPages };
}

describe('PlatformOrderListPage', () => {
  let fixture: ComponentFixture<PlatformOrderListPage>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PlatformOrderListPage);
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
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('size')).toBe('20');
    return request;
  }

  async function respond(result: Page<PlatformOrder>): Promise<void> {
    expectPage(result.page).flush(result);
    await fixture.whenStable();
  }

  async function fail(pageNumber: number, status = 500, code?: string): Promise<void> {
    expectPage(pageNumber).flush(
      { status, code, detail: 'Detalle del servidor' },
      { status, statusText: 'Error' },
    );
    await fixture.whenStable();
  }

  describe('the first load', () => {
    it('shows a placeholder while the orders load', async () => {
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando los pedidos…']);

      await respond(pageOf([NEWEST]));

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows every order of the platform in the order of the API', async () => {
      await respond(pageOf([NEWEST, OLDER]));

      expect(titles()).toEqual(['Pedido #43 · El Fogón', 'Pedido #42 · La Casona']);
      const statuses = Array.from(page().querySelectorAll('li [data-status]'), (status) =>
        status.textContent?.trim(),
      );
      expect(statuses).toEqual(['En preparación', 'Completado']);
      expect(page().querySelector('[data-total-orders]')?.textContent).toContain('2 pedidos');
    });

    it('tells what each order has, how many units and how much it costs', async () => {
      await respond(pageOf([NEWEST]));

      const row = page().querySelector('li') as HTMLElement;
      expect(row.querySelector('[data-items]')?.textContent?.trim()).toBe(
        '2 × Silpancho, 1 × Limonada',
      );
      expect(row.querySelector('[data-units]')?.textContent?.trim()).toBe('3 productos');
      expect(row.querySelector('[data-total]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Total: Bs 100,50',
      );
      expect(row.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-08T15:00:00Z');
    });

    it('explains that there are no orders yet without a count of zero', async () => {
      await respond(pageOf([]));

      expect(text()).toContain('Todavía no hay pedidos');
      expect(list()).toBeNull();
      expect(page().querySelector('[data-total-orders]')).toBeNull();
      expect(text()).not.toContain('0 pedidos');
    });

    it('explains that the orders could not load and loads them again', async () => {
      await fail(0);

      const alert = page().querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('No pudimos cargar los pedidos');
      expect(alert?.textContent).toContain('Detalle del servidor');

      button('Reintentar').click();
      await respond(pageOf([NEWEST]));

      expect(page().querySelector('[role="alert"]')).toBeNull();
      expect(titles()).toEqual(['Pedido #43 · El Fogón']);
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('says that the account cannot see the orders when the API denies it', async () => {
      await fail(0, 403, 'access_denied');

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'Tu cuenta no tiene permiso para ver los pedidos de la plataforma.',
      );
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      await fail(0);
      const retry = button('Reintentar');
      retry.focus();

      retry.click();
      await fixture.whenStable();
      retry.click();

      expect(page().querySelector('app-load-error')).toBeTruthy();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await respond(pageOf([NEWEST]));

      expect(page().querySelector('app-load-error')).toBeNull();
    });

    it('cancels the request when the admin leaves before it answers', () => {
      fixture.destroy();

      expect(expectPage(0).cancelled).toBe(true);
    });
  });

  describe('the pages', () => {
    const MANY = 45;

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

      expectPage(2).flush(pageOf([], 2, 30, 2));
      await fixture.whenStable();
      await respond(pageOf([OLDER], 1, 30, 2));

      expect(titles()).toEqual(['Pedido #42 · La Casona']);
      expect(text()).toContain('Página 2 de 2');
    });
  });
});
