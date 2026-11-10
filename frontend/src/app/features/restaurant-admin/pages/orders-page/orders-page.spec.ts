import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Page } from '@core/http/page';
import { OrderStatus } from '@shared/utils/order-status';
import { Order } from '../../models/order';
import { OrdersPage } from './orders-page';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class RestaurantStub {}

const ORDERS_URL = '/api/v1/restaurants/mine/orders';
const IN_PROGRESS = ['PLACED', 'ACCEPTED', 'READY'];
const FINISHED = ['PICKED_UP', 'REJECTED', 'CANCELLED'];

function order(id: number, status: OrderStatus): Order {
  return {
    id,
    restaurantId: 4,
    restaurantName: 'La Casona',
    status,
    total: 90,
    placedAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:00:00Z',
    items: [{ productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 }],
  };
}

function pageOf(
  items: Order[],
  page = 0,
  totalItems = items.length,
  totalPages = Math.ceil(totalItems / 20),
): Page<Order> {
  return { items, page, size: 20, totalItems, totalPages };
}

describe('OrdersPage', () => {
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'mi-restaurante',
            children: [
              { path: '', component: RestaurantStub },
              { path: 'pedidos', component: OrdersPage },
            ],
          },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/mi-restaurante/pedidos');
  });

  afterEach(() => httpTesting.verify());

  function page(): HTMLElement {
    return harness.routeNativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  async function stable(): Promise<void> {
    await harness.fixture.whenStable();
  }

  function titles(): string[] {
    return Array.from(page().querySelectorAll('li h2'), (title) => title.textContent?.trim() ?? '');
  }

  function button(label: string, within: Element = page()): HTMLButtonElement {
    const found = Array.from(within.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  function card(id: number): HTMLElement {
    const found = Array.from(page().querySelectorAll('article')).find(
      (candidate) => candidate.querySelector('h2')?.textContent?.trim() === `Pedido #${id}`,
    );
    if (!found) {
      throw new Error(`No card for order ${id}`);
    }
    return found as HTMLElement;
  }

  function notice(): HTMLElement | null {
    return page().querySelector('[data-sticky-notice] [role]');
  }

  function expectList(statuses: string[], pageNumber = 0) {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === ORDERS_URL &&
        candidate.params.get('page') === `${pageNumber}` &&
        JSON.stringify(candidate.params.getAll('status')) === JSON.stringify(statuses),
    );
    expect(request.request.params.get('size')).toBe('20');
    return request;
  }

  async function respond(result: Page<Order>, statuses = IN_PROGRESS): Promise<void> {
    expectList(statuses, result.page).flush(result);
    await stable();
  }

  function fail(url: string, status: number, code?: string): void {
    httpTesting
      .expectOne(url)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
  }

  describe('the list', () => {
    it('loads the orders in progress first while it shows a placeholder', async () => {
      expect(page().querySelector('[role="status"]')?.textContent).toContain(
        'Cargando los pedidos',
      );

      await respond(pageOf([order(43, 'PLACED'), order(42, 'ACCEPTED')]));

      expect(page().querySelector('[role="status"]')).toBeNull();
      expect(titles()).toEqual(['Pedido #43', 'Pedido #42']);
      expect(button('En curso').getAttribute('aria-pressed')).toBe('true');
      expect(button('Terminados').getAttribute('aria-pressed')).toBe('false');
    });

    it('explains that there are no orders in progress', async () => {
      await respond(pageOf([]));

      expect(text()).toContain('No tienes pedidos en curso');
      expect(page().querySelector('ul')).toBeNull();
    });

    it('switches to the finished orders from the first page', async () => {
      await respond(pageOf([order(43, 'PLACED')]));

      button('Terminados').click();
      await stable();
      await respond(pageOf([]), FINISHED);

      expect(button('Terminados').getAttribute('aria-pressed')).toBe('true');
      expect(text()).toContain('Todavía no hay pedidos terminados');
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('keeps the empty message of the shown list while the other one loads', async () => {
      await respond(pageOf([]));

      button('Terminados').click();
      await stable();

      expect(text()).toContain('No tienes pedidos en curso');
      expect(text()).not.toContain('Todavía no hay pedidos terminados');
      await respond(pageOf([order(40, 'PICKED_UP')]), FINISHED);

      expect(titles()).toEqual(['Pedido #40']);
    });

    it('loads the same orders again, says so and keeps the focus on the button', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      const refresh = button('Actualizar');
      refresh.focus();

      refresh.click();
      await stable();

      expect(refresh.textContent).toContain('Actualizando…');
      expect(refresh.getAttribute('aria-disabled')).toBe('true');
      await respond(pageOf([order(44, 'PLACED'), order(43, 'PLACED')]));

      expect(titles()).toEqual(['Pedido #44', 'Pedido #43']);
      expect(refresh.textContent).toContain('Actualizar');
      expect(page().querySelector('[data-refresh-announcement]')?.textContent?.trim()).toBe(
        'Lista actualizada: 2 pedidos en curso.',
      );
      expect(document.activeElement).toBe(refresh);
    });

    it('counts the orders of the shown list', async () => {
      await respond(pageOf([order(43, 'PLACED')], 0, 1));

      expect(page().querySelector('[data-total-orders]')?.textContent?.trim()).toBe(
        '1 pedido en curso',
      );
    });

    it('explains that the orders could not load and loads them again', async () => {
      fail(`${ORDERS_URL}?status=PLACED&status=ACCEPTED&status=READY&page=0&size=20`, 500);
      await stable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar los pedidos',
      );

      button('Reintentar').click();
      await stable();
      await respond(pageOf([order(43, 'PLACED')]));

      expect(titles()).toEqual(['Pedido #43']);
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      fail(`${ORDERS_URL}?status=PLACED&status=ACCEPTED&status=READY&page=0&size=20`, 500);
      await stable();
      const retry = button('Reintentar');
      retry.focus();

      retry.click();
      await stable();
      retry.click();

      expect(page().querySelector('app-load-error')?.textContent).toContain(
        'No pudimos cargar los pedidos',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await respond(pageOf([order(43, 'PLACED')]));

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(titles()).toEqual(['Pedido #43']);
    });

    it('sends an owner without a restaurant to register it', async () => {
      fail(
        `${ORDERS_URL}?status=PLACED&status=ACCEPTED&status=READY&page=0&size=20`,
        404,
        'restaurant.not_found',
      );
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });

    it('goes to another page keeping the current one in view meanwhile', async () => {
      await respond(pageOf([order(43, 'PLACED')], 0, 30));

      button('Siguiente').click();
      await stable();

      const request = expectList(IN_PROGRESS, 1);
      expect(page().querySelector('ul')?.getAttribute('aria-busy')).toBe('true');
      request.flush(pageOf([order(20, 'READY')], 1, 30));
      await stable();

      expect(titles()).toEqual(['Pedido #20']);
      expect(text()).toContain('Página 2 de 2');
    });
  });

  describe('the steps of an order', () => {
    it('accepts an order, shows it as the backend answers and announces it', async () => {
      await respond(pageOf([order(43, 'PLACED'), order(42, 'PLACED')]));

      button('Aceptar', card(43)).click();
      await stable();
      expect(button('Aceptando…', card(43)).getAttribute('aria-disabled')).toBe('true');
      expect(button('Aceptar', card(42)).getAttribute('aria-disabled')).toBe('true');
      const request = httpTesting.expectOne(`${ORDERS_URL}/43/accept`);
      expect(request.request.method).toBe('POST');
      request.flush(order(43, 'ACCEPTED'));
      await stable();

      expect(card(43).querySelector('[data-status]')?.textContent?.trim()).toBe('En preparación');
      expect(notice()?.getAttribute('role')).toBe('status');
      expect(notice()?.textContent).toContain('Aceptaste el pedido #43.');
      expect(document.activeElement).toBe(button('Marcar listo', card(43)));
    });

    it('rejects an order after the owner confirms it', async () => {
      await respond(pageOf([order(43, 'PLACED')]));

      button('Rechazar', card(43)).click();
      await stable();
      button('Sí, rechazar', card(43)).click();
      await stable();
      httpTesting.expectOne(`${ORDERS_URL}/43/reject`).flush(order(43, 'REJECTED'));
      await stable();

      expect(card(43).querySelector('[data-status]')?.textContent?.trim()).toBe('Rechazado');
      expect(card(43).querySelectorAll('button[data-action]')).toHaveLength(0);
      expect(notice()?.textContent).toContain('Rechazaste el pedido #43.');
      expect(document.activeElement).toBe(card(43).querySelector('h2'));
    });

    it.each([
      ['ACCEPTED', 'Marcar listo', 'mark-ready', 'READY', 'El pedido #43 está listo para retirar.'],
      ['READY', 'Entregar', 'mark-picked-up', 'PICKED_UP', 'Entregaste el pedido #43.'],
    ] as const)(
      'moves an order in %s with "%s"',
      async (status, label, path, next, announcement) => {
        await respond(pageOf([order(43, status)]));

        button(label, card(43)).click();
        await stable();
        httpTesting.expectOne(`${ORDERS_URL}/43/${path}`).flush(order(43, next));
        await stable();

        expect(notice()?.textContent).toContain(announcement);
      },
    );

    it('keeps a single question open across the orders', async () => {
      await respond(pageOf([order(43, 'PLACED'), order(44, 'PLACED')]));

      button('Rechazar', card(43)).click();
      await stable();
      button('Rechazar', card(44)).click();
      await stable();

      expect(page().querySelectorAll('app-confirm-panel')).toHaveLength(1);
      expect(card(44).querySelector('app-confirm-panel')).toBeTruthy();
      expect(button('Rechazar', card(43)).getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(button('Mantener pedido', card(44)));
    });

    it('closes the question when the list loads again', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      button('Rechazar', card(43)).click();
      await stable();

      button('Actualizar').click();
      await stable();
      await respond(pageOf([order(43, 'PLACED')]));

      expect(page().querySelector('app-confirm-panel')).toBeNull();
      expect(button('Rechazar', card(43)).getAttribute('aria-expanded')).toBe('false');
    });

    it('warns that the order changed and loads the list again', async () => {
      await respond(pageOf([order(43, 'PLACED')]));

      button('Aceptar', card(43)).click();
      await stable();
      fail(`${ORDERS_URL}/43/accept`, 409, 'order.invalid_transition');
      await stable();
      await respond(pageOf([]));

      expect(notice()?.textContent).toContain(
        'El pedido #43 cambió de estado. Actualizamos la lista.',
      );
      expect(text()).toContain('No tienes pedidos en curso');
    });

    it('keeps the order and the focus where they were when the step fails', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      const accept = button('Aceptar', card(43));
      accept.focus();

      accept.click();
      await stable();
      fail(`${ORDERS_URL}/43/accept`, 500);
      await stable();

      expect(notice()?.getAttribute('role')).toBe('alert');
      expect(notice()?.textContent).toContain('Detalle del servidor');
      expect(card(43).querySelector('[data-status]')?.textContent?.trim()).toBe('Pendiente');
      expect(document.activeElement).toBe(button('Aceptar', card(43)));
    });

    it('sends an owner whose restaurant disappeared to register it', async () => {
      await respond(pageOf([order(43, 'ACCEPTED')]));

      button('Marcar listo', card(43)).click();
      await stable();
      fail(`${ORDERS_URL}/43/mark-ready`, 404, 'restaurant.not_found');
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });
  });
});
