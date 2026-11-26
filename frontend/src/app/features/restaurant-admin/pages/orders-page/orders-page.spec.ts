import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Page } from '@core/http/page';
import { FakeEventSources } from '@core/live/fake-event-sources';
import { INTERRUPTION_GRACE_MS } from '@core/live/live-connection';
import { OPEN_EVENT_SOURCE } from '@core/live/server-events';
import { OrderStatus } from '@shared/utils/order-status';
import { Announcer } from '@shared/ui/live-region/announcer';
import { NewOrderChime } from '../../data-access/new-order-chime';
import { Order } from '../../models/order';
import { OrdersPage } from './orders-page';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class RestaurantStub {}

const ORDERS_URL = '/api/v1/restaurants/mine/orders';
const EVENTS_URL = '/api/v1/restaurants/mine/orders/events';
const ACTIVE_URL = `${ORDERS_URL}?status=PLACED&status=ACCEPTED&status=IN_PREPARATION&status=READY&page=0&size=100`;
const TITLE = 'Pedidos del restaurante | Pedidos';
const IN_PROGRESS = ['PLACED', 'ACCEPTED', 'IN_PREPARATION', 'READY'];
const FINISHED = ['PICKED_UP', 'REJECTED', 'CANCELLED'];

class FakeChime {
  plays = 0;
  unlocks = 0;
  playable = true;

  play(): Promise<boolean> {
    this.plays += 1;
    return Promise.resolve(this.playable);
  }

  unlock(): Promise<boolean> {
    this.unlocks += 1;
    return Promise.resolve(this.playable);
  }
}

function order(id: number, status: OrderStatus, placedAt = '2026-11-08T15:00:00Z'): Order {
  return {
    id,
    restaurantId: 4,
    restaurantName: 'La Casona',
    status,
    total: 90,
    placedAt,
    updatedAt: placedAt,
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
  let events: FakeEventSources;
  let chime: FakeChime;

  beforeEach(async () => {
    events = new FakeEventSources();
    chime = new FakeChime();
    TestBed.configureTestingModule({
      providers: [
        { provide: OPEN_EVENT_SOURCE, useValue: events.open },
        { provide: NewOrderChime, useValue: chime },
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

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

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
    return Array.from(page().querySelectorAll('li h3'), (title) => title.textContent?.trim() ?? '');
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
      (candidate) => candidate.querySelector('h3')?.textContent?.trim() === `Pedido #${id}`,
    );
    if (!found) {
      throw new Error(`No card for order ${id}`);
    }
    return found as HTMLElement;
  }

  function notice(): HTMLElement | null {
    return page().querySelector('app-sticky-notice');
  }

  function expectList(statuses: string[], pageNumber = 0) {
    const request = httpTesting.expectOne(
      (candidate) =>
        candidate.url === ORDERS_URL &&
        candidate.params.get('page') === `${pageNumber}` &&
        JSON.stringify(candidate.params.getAll('status')) === JSON.stringify(statuses),
    );
    expect(request.request.params.get('size')).toBe(statuses === IN_PROGRESS ? '100' : '20');
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
      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando los pedidos…']);

      await respond(pageOf([order(43, 'PLACED'), order(42, 'ACCEPTED')]));

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
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

      expect(titles()).toEqual(['Pedido #43', 'Pedido #44']);
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
      fail(ACTIVE_URL, 500);
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
      fail(ACTIVE_URL, 500);
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

    async function showFinished(result: Page<Order>): Promise<void> {
      await respond(pageOf([]));
      button('Terminados').click();
      await stable();
      await respond(result, FINISHED);
    }

    it('groups the orders in progress by status, the oldest first', async () => {
      await respond(
        pageOf([
          order(46, 'READY', '2026-11-08T15:20:00Z'),
          order(45, 'PLACED', '2026-11-08T15:10:00Z'),
          order(44, 'PLACED', '2026-11-08T15:05:00Z'),
          order(43, 'IN_PREPARATION', '2026-11-08T15:00:00Z'),
        ]),
      );

      const columns = Array.from(page().querySelectorAll('[data-column]'), (column) => ({
        heading: column.querySelector('h2')?.firstChild?.textContent?.trim(),
        count: column.querySelector('[data-column-count]')?.textContent?.trim(),
        orders: Array.from(column.querySelectorAll('h3'), (title) => title.textContent?.trim()),
      }));
      expect(columns).toEqual([
        { heading: 'Pendientes', count: '2', orders: ['Pedido #44', 'Pedido #45'] },
        { heading: 'Aceptados', count: '0', orders: [] },
        { heading: 'En preparación', count: '1', orders: ['Pedido #43'] },
        { heading: 'Listos', count: '1', orders: ['Pedido #46'] },
      ]);
      expect(text()).toContain('Ninguno por ahora');
      expect(page().querySelector('app-pagination')).toBeNull();
    });

    it('keeps retrying in view when the page it retries is empty now', async () => {
      const first = Array.from({ length: 20 }, (_, index) => order(100 + index, 'PICKED_UP'));
      await showFinished(pageOf(first, 0, 25));
      button('Siguiente').click();
      await stable();
      expectList(FINISHED, 1).flush(
        { status: 500, detail: 'Detalle del servidor' },
        { status: 500, statusText: 'Error' },
      );
      await stable();
      const retry = button('Reintentar');
      retry.focus();

      retry.click();
      await stable();
      expectList(FINISHED, 1).flush(pageOf([], 1, 5, 1));
      await stable();

      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      await respond(pageOf([order(43, 'PICKED_UP')]), FINISHED);

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(titles()).toEqual(['Pedido #43']);
    });

    it('sends an owner without a restaurant to register it', async () => {
      fail(ACTIVE_URL, 404, 'restaurant.not_found');
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });

    it('goes to another page of the finished orders keeping the current one in view', async () => {
      await showFinished(pageOf([order(43, 'PICKED_UP')], 0, 30));

      button('Siguiente').click();
      await stable();

      const request = expectList(FINISHED, 1);
      expect(page().querySelector('ul')?.getAttribute('aria-busy')).toBe('true');
      request.flush(pageOf([order(20, 'REJECTED')], 1, 30));
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

      expect(card(43).querySelector('[data-status]')?.textContent?.trim()).toBe('Aceptado');
      expect(notice()?.querySelector('[role]')).toBeNull();
      expect(notice()?.textContent).toContain('Aceptaste el pedido #43.');
      expect(announced()).toEqual(['Aceptaste el pedido #43.']);
      expect(document.activeElement).toBe(button('Empezar a preparar', card(43)));
    });

    it('rejects an order after the owner confirms it', async () => {
      await respond(pageOf([order(43, 'PLACED')]));

      button('Rechazar', card(43)).click();
      await stable();
      button('Sí, rechazar', card(43)).click();
      await stable();
      httpTesting.expectOne(`${ORDERS_URL}/43/reject`).flush(order(43, 'REJECTED'));
      await stable();

      expect(titles()).toEqual([]);
      expect(notice()?.textContent).toContain('Rechazaste el pedido #43.');
      expect(document.activeElement).toBe(page().querySelector('#column-PLACED'));
    });

    it('takes the focus to the next order of the column when one leaves the board', async () => {
      await respond(pageOf([order(43, 'READY'), order(44, 'READY')]));

      button('Entregar', card(43)).click();
      await stable();
      httpTesting.expectOne(`${ORDERS_URL}/43/mark-picked-up`).flush(order(43, 'PICKED_UP'));
      await stable();

      expect(titles()).toEqual(['Pedido #44']);
      expect(document.activeElement).toBe(button('Entregar', card(44)));
    });

    it.each([
      [
        'ACCEPTED',
        'Empezar a preparar',
        'start-preparing',
        'IN_PREPARATION',
        'Empezaste a preparar el pedido #43.',
      ],
      [
        'IN_PREPARATION',
        'Marcar listo',
        'mark-ready',
        'READY',
        'El pedido #43 está listo para retirar.',
      ],
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
        expect(titles()).toEqual(next === 'PICKED_UP' ? [] : ['Pedido #43']);
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

      expect(notice()?.querySelector('[role="alert"]')).toBeTruthy();
      expect(notice()?.textContent).toContain('Detalle del servidor');
      expect(card(43).querySelector('[data-status]')?.textContent?.trim()).toBe('Pendiente');
      expect(document.activeElement).toBe(button('Aceptar', card(43)));
    });

    it('sends an owner whose restaurant disappeared to register it', async () => {
      await respond(pageOf([order(43, 'IN_PREPARATION')]));

      button('Marcar listo', card(43)).click();
      await stable();
      fail(`${ORDERS_URL}/43/mark-ready`, 404, 'restaurant.not_found');
      await stable();

      expect(TestBed.inject(Router).url).toBe('/mi-restaurante');
    });
  });
  describe('live', () => {
    function source() {
      return events.latest(EVENTS_URL);
    }

    async function hear(orderId: number, status: OrderStatus): Promise<void> {
      source().emit('order', { orderId, status });
      await stable();
    }

    function switchOfSound(): HTMLButtonElement {
      const found = page().querySelector<HTMLButtonElement>('[data-chime-switch]');
      if (!found) {
        throw new Error('No sound switch');
      }
      return found;
    }

    it('follows the orders of the restaurant and says it is live', async () => {
      await respond(pageOf([order(42, 'ACCEPTED')]));

      source().connect();
      await stable();

      expect(page().querySelector('[data-live]')?.textContent?.trim()).toBe('En vivo');
    });

    it('shows a new order as it arrives, rings, announces it and counts it in the tab', async () => {
      await respond(pageOf([order(42, 'ACCEPTED')]));
      source().connect();
      const accepted = button('Empezar a preparar', card(42));
      accepted.focus();

      await hear(43, 'PLACED');
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(page().querySelector('[aria-busy="true"]')).toBeNull();
      await respond(pageOf([order(43, 'PLACED'), order(42, 'ACCEPTED')]));

      expect(titles()).toEqual(['Pedido #43', 'Pedido #42']);
      expect(card(43).querySelector('[data-fresh]')?.textContent?.trim()).toBe('Nuevo');
      expect(card(42).querySelector('[data-fresh]')).toBeNull();
      expect(chime.plays).toBe(1);
      expect(announced()).toEqual(['Nuevo pedido #43. Tienes 1 pendiente.']);
      expect(TestBed.inject(Title).getTitle()).toBe(`(1) ${TITLE}`);
      expect(document.activeElement).toBe(accepted);
    });

    it('stops marking an order as new once the owner accepts it', async () => {
      await respond(pageOf([]));
      await hear(43, 'PLACED');
      await respond(pageOf([order(43, 'PLACED')]));

      button('Aceptar', card(43)).click();
      await stable();
      httpTesting.expectOne(`${ORDERS_URL}/43/accept`).flush(order(43, 'ACCEPTED'));
      await stable();

      expect(card(43).querySelector('[data-fresh]')).toBeNull();
      expect(TestBed.inject(Title).getTitle()).toBe(TITLE);
    });

    it('ignores the news of a step the owner just took', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      button('Aceptar', card(43)).click();
      await stable();
      httpTesting.expectOne(`${ORDERS_URL}/43/accept`).flush(order(43, 'ACCEPTED'));
      await stable();

      await hear(43, 'ACCEPTED');

      httpTesting.expectNone(ACTIVE_URL);
    });

    it('waits for a step in progress before it loads the news', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      button('Aceptar', card(43)).click();
      await stable();

      await hear(44, 'PLACED');
      httpTesting.expectNone(ACTIVE_URL);
      httpTesting.expectOne(`${ORDERS_URL}/43/accept`).flush(order(43, 'ACCEPTED'));
      await stable();
      await respond(pageOf([order(44, 'PLACED'), order(43, 'ACCEPTED')]));

      expect(titles()).toEqual(['Pedido #44', 'Pedido #43']);
    });

    it('warns when the customer cancels a pending order', async () => {
      await respond(pageOf([order(43, 'PLACED')]));

      await hear(43, 'CANCELLED');
      await respond(pageOf([]));

      expect(notice()?.querySelector('[role="alert"]')?.textContent).toContain(
        'El cliente canceló el pedido #43.',
      );
      expect(text()).toContain('No tienes pedidos en curso');
      expect(TestBed.inject(Title).getTitle()).toBe(TITLE);
    });

    it('moves the focus to the next order of the column when the one it was on goes away', async () => {
      await respond(pageOf([order(43, 'PLACED'), order(44, 'PLACED'), order(45, 'ACCEPTED')]));
      button('Aceptar', card(43)).focus();

      await hear(43, 'CANCELLED');
      await respond(pageOf([order(44, 'PLACED'), order(45, 'ACCEPTED')]));

      expect(document.activeElement).toBe(button('Rechazar', card(44)));
    });

    it('marks, rings and announces the orders that arrived while it was disconnected', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      source().connect();

      source().drop();
      source().connect();
      await stable();
      await respond(pageOf([order(43, 'PLACED'), order(44, 'PLACED'), order(45, 'PLACED')]));

      expect(card(43).querySelector('[data-fresh]')).toBeNull();
      expect(card(44).querySelector('[data-fresh]')).toBeTruthy();
      expect(card(45).querySelector('[data-fresh]')).toBeTruthy();
      expect(chime.plays).toBe(1);
      expect(announced()).toEqual(['Llegaron 2 pedidos nuevos. Tienes 3 pendientes.']);
    });

    it('does not ring with the sound turned off', async () => {
      await respond(pageOf([]));
      switchOfSound().click();
      await stable();

      await hear(43, 'PLACED');
      await respond(pageOf([order(43, 'PLACED')]));

      expect(switchOfSound().getAttribute('aria-checked')).toBe('false');
      expect(chime.plays).toBe(0);
    });

    it('turns the sound off when the browser blocks it and lets the owner turn it on', async () => {
      chime.playable = false;
      await respond(pageOf([]));

      await hear(43, 'PLACED');
      await respond(pageOf([order(43, 'PLACED')]));

      expect(switchOfSound().getAttribute('aria-checked')).toBe('false');
      expect(page().querySelector('[data-chime-blocked]')?.textContent?.trim()).toBe(
        'Tu navegador silenció el sonido. Actívalo de nuevo.',
      );

      chime.playable = true;
      switchOfSound().click();
      await stable();

      expect(chime.unlocks).toBe(2);
      expect(switchOfSound().getAttribute('aria-checked')).toBe('true');
      expect(page().querySelector('[data-chime-blocked]')).toBeNull();
    });

    it('loads the board again when it reconnects', async () => {
      await respond(pageOf([order(43, 'PLACED')]));
      source().connect();

      source().drop();
      source().connect();
      await stable();
      await respond(pageOf([order(44, 'PLACED'), order(43, 'PLACED')]));

      expect(titles()).toEqual(['Pedido #43', 'Pedido #44']);
    });

    it('shows that it is reconnecting after a few seconds without connection', async () => {
      await respond(pageOf([]));
      source().connect();
      vi.useFakeTimers();
      try {
        source().drop();
        vi.advanceTimersByTime(INTERRUPTION_GRACE_MS);
        harness.fixture.detectChanges();

        expect(page().querySelector('[data-reconnecting]')?.textContent?.trim()).toBe(
          'Reconectando…',
        );
      } finally {
        vi.useRealTimers();
      }
    });
  });
  describe('the sound when the page opens', () => {
    it('starts turned off and says how to turn it on when the browser does not let it play yet', async () => {
      TestBed.resetTestingModule();
      events = new FakeEventSources();
      chime = new FakeChime();
      chime.playable = false;
      TestBed.configureTestingModule({
        providers: [
          { provide: OPEN_EVENT_SOURCE, useValue: events.open },
          { provide: NewOrderChime, useValue: chime },
          provideRouter([{ path: 'mi-restaurante/pedidos', component: OrdersPage }]),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
      httpTesting = TestBed.inject(HttpTestingController);
      harness = await RouterTestingHarness.create('/mi-restaurante/pedidos');
      await respond(pageOf([]));

      const sound = page().querySelector('[data-chime-switch]');
      expect(sound?.getAttribute('aria-checked')).toBe('false');
      expect(page().querySelector('[data-chime-blocked] [role="alert"]')?.textContent?.trim()).toBe(
        'Toca el interruptor para activar el sonido.',
      );
      expect(sound?.getAttribute('aria-describedby')).toBe('chime-warning');
    });
  });
});
