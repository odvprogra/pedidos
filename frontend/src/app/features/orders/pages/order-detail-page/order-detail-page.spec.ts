import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { FakeEventSources } from '@core/live/fake-event-sources';
import { OPEN_EVENT_SOURCE } from '@core/live/server-events';
import { formatDateTime } from '@shared/utils/format-date-time';
import { Announcer } from '@shared/ui/live-region/announcer';
import { Order } from '../../models/order';
import { OrderDetailPage } from './order-detail-page';

const ORDER_URL = '/api/v1/orders/42';
const CANCEL_URL = '/api/v1/orders/42/cancel';
const PENDING: Order = {
  id: 42,
  restaurantId: 4,
  restaurantName: 'La Casona',
  status: 'PLACED',
  total: 100.5,
  placedAt: '2026-11-08T15:00:00Z',
  updatedAt: '2026-11-08T15:00:00Z',
  items: [
    { productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 },
    { productId: 12, productName: 'Limonada', unitPrice: 10.5, quantity: 1, subtotal: 10.5 },
  ],
};
const CANCELLED: Order = { ...PENDING, status: 'CANCELLED', updatedAt: '2026-11-08T15:10:00Z' };
const ACCEPTED: Order = { ...PENDING, status: 'ACCEPTED', updatedAt: '2026-11-08T15:05:00Z' };

describe('OrderDetailPage', () => {
  let fixture: ComponentFixture<OrderDetailPage>;
  let httpTesting: HttpTestingController;
  let events: FakeEventSources;

  beforeEach(() => {
    events = new FakeEventSources();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OPEN_EVENT_SOURCE, useValue: events.open },
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OrderDetailPage);
  });

  afterEach(() => httpTesting.verify());

  function announced(): string[] {
    return TestBed.inject(Announcer)
      .shown()
      .map(({ message }) => message);
  }

  async function open(id: string): Promise<void> {
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
  }

  async function openWith(order: Order): Promise<void> {
    await open(String(order.id));
    httpTesting.expectOne(ORDER_URL).flush(order);
    await fixture.whenStable();
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function status(): string | undefined {
    return page().querySelector('[data-status]')?.textContent?.trim();
  }

  function button(label: string): HTMLButtonElement | undefined {
    return Array.from(page().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
  }

  function requireButton(label: string): HTMLButtonElement {
    const found = button(label);
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  function notice(): HTMLElement | null {
    return page().querySelector('app-sticky-notice');
  }

  async function confirmCancellation(): Promise<void> {
    requireButton('Cancelar pedido').click();
    await fixture.whenStable();
    requireButton('Sí, cancelar').click();
    await fixture.whenStable();
  }

  describe('the load', () => {
    it('shows a placeholder while the order loads', async () => {
      await open('42');

      expect(page().querySelector('[appskeleton]')).toBeTruthy();
      expect(announced()).toEqual(['Cargando tu pedido…']);

      httpTesting.expectOne(ORDER_URL).flush(PENDING);
      await fixture.whenStable();

      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(announced()).toEqual([]);
    });

    it('shows the number, the status and what happens next', async () => {
      await openWith(PENDING);

      expect(page().querySelector('h1')?.textContent?.trim()).toBe('Pedido #42');
      expect(status()).toBe('Pendiente');
      expect(page().querySelector('[data-hint]')?.textContent?.trim()).toBe(
        'Esperando que La Casona lo acepte. Puedes cancelarlo mientras tanto.',
      );
      expect(TestBed.inject(Title).getTitle()).toBe('Pedido #42 | Pedidos');
    });

    it('lists the items with their subtotals and the total', async () => {
      await openWith(PENDING);

      const items = Array.from(page().querySelectorAll('[data-item]'), (item) =>
        item.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(items).toEqual(['2 × Silpancho Bs 90,00', '1 × Limonada Bs 10,50']);
      expect(page().querySelector('[data-total]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Bs 100,50',
      );
    });

    it('links to the menu of the restaurant', async () => {
      await openWith(PENDING);

      const link = page().querySelector('[data-restaurant-link]') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/restaurantes/4');
      expect(link.textContent).toContain('La Casona');
    });

    it.each(['PLACED', 'ACCEPTED', 'IN_PREPARATION'] as const)(
      'reminds that an order in %s is picked up and paid at the restaurant',
      async (orderStatus) => {
        await openWith({ ...PENDING, status: orderStatus });

        expect(page().querySelector('[data-pickup-note]')?.textContent?.trim()).toBe(
          'Lo retiras en el local y lo pagas ahí.',
        );
      },
    );

    it.each(['READY', 'PICKED_UP', 'REJECTED', 'CANCELLED'] as const)(
      'leaves the pickup reminder out of an order in %s',
      async (orderStatus) => {
        await openWith({ ...PENDING, status: orderStatus });

        expect(page().querySelector('[data-pickup-note]')).toBeNull();
      },
    );

    it('says when the order was placed and hides the last change while there is none', async () => {
      await openWith(PENDING);

      expect(text()).toContain(`Confirmado el ${formatDateTime(PENDING.placedAt)}`);
      expect(text()).not.toContain('Último cambio');
    });

    it('says when the status changed for the last time', async () => {
      await openWith(ACCEPTED);

      expect(text()).toContain(`Último cambio el ${formatDateTime(ACCEPTED.updatedAt)}`);
    });

    it('does not ask the backend for an id that is not a number', async () => {
      await open('abc');

      expect(page().querySelector('h1')?.textContent?.trim()).toBe('No encontramos este pedido');
      httpTesting.expectNone(() => true);
    });

    it.each([
      [404, 'order.not_found'],
      [403, 'order.not_owner'],
    ])('treats a %s with %s as an order that is not there', async (code, problemCode) => {
      await open('42');
      httpTesting
        .expectOne(ORDER_URL)
        .flush(
          { status: code, detail: 'Detalle', code: problemCode },
          { status: code, statusText: 'Error' },
        );
      await fixture.whenStable();

      expect(page().querySelector('h1')?.textContent?.trim()).toBe('No encontramos este pedido');
      const link = page().querySelector('a[appButton]') as HTMLAnchorElement;
      expect(link.textContent?.trim()).toBe('Ver mis pedidos');
      expect(link.getAttribute('href')).toBe('/pedidos');
      expect(TestBed.inject(Title).getTitle()).toBe('Pedido no encontrado | Pedidos');
    });

    it('keeps the error in view while it loads again and asks only once', async () => {
      await open('42');
      httpTesting
        .expectOne(ORDER_URL)
        .flush(
          { status: 500, detail: 'Detalle del servidor' },
          { status: 500, statusText: 'Error' },
        );
      await fixture.whenStable();
      const retry = requireButton('Reintentar');
      retry.focus();

      retry.click();
      await fixture.whenStable();
      retry.click();

      expect(page().querySelector('app-load-error')?.textContent).toContain(
        'No pudimos cargar tu pedido',
      );
      expect(page().querySelector('[appskeleton]')).toBeNull();
      expect(retry.textContent).toContain('Reintentando…');
      expect(document.activeElement).toBe(retry);
      httpTesting.expectOne(ORDER_URL).flush(PENDING);
      await fixture.whenStable();

      expect(page().querySelector('app-load-error')).toBeNull();
      expect(status()).toBe('Pendiente');
    });

    it('explains that the order could not load and loads it again', async () => {
      await open('42');
      httpTesting
        .expectOne(ORDER_URL)
        .flush(
          { status: 500, detail: 'Detalle del servidor' },
          { status: 500, statusText: 'Error' },
        );
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu pedido',
      );

      requireButton('Reintentar').click();
      httpTesting.expectOne(ORDER_URL).flush(PENDING);
      await fixture.whenStable();

      expect(status()).toBe('Pendiente');
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });
  });

  describe('the cancellation', () => {
    it.each(['ACCEPTED', 'IN_PREPARATION', 'READY', 'PICKED_UP', 'REJECTED', 'CANCELLED'] as const)(
      'is not offered for an order in %s',
      async (orderStatus) => {
        await openWith({ ...PENDING, status: orderStatus });

        expect(button('Cancelar pedido')).toBeUndefined();
      },
    );

    it('asks first and takes the focus to keeping the order', async () => {
      await openWith(PENDING);

      requireButton('Cancelar pedido').click();
      await fixture.whenStable();

      expect(text()).toContain('¿Cancelar el pedido #42?');
      expect(text()).toContain('La Casona ya no lo va a preparar. Esto no se puede deshacer.');
      expect(document.activeElement).toBe(requireButton('Mantener pedido'));
      expect(requireButton('Cancelar pedido').getAttribute('aria-expanded')).toBe('true');
      httpTesting.expectNone(CANCEL_URL);
    });

    it('keeps the order and returns the focus when the customer changes their mind', async () => {
      await openWith(PENDING);
      requireButton('Cancelar pedido').click();
      await fixture.whenStable();

      requireButton('Mantener pedido').click();
      await fixture.whenStable();

      expect(text()).not.toContain('¿Cancelar el pedido #42?');
      expect(document.activeElement).toBe(requireButton('Cancelar pedido'));
      httpTesting.expectNone(CANCEL_URL);
    });

    it('closes the question with Escape', async () => {
      await openWith(PENDING);
      requireButton('Cancelar pedido').click();
      await fixture.whenStable();

      requireButton('Mantener pedido').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape' }),
      );
      await fixture.whenStable();

      expect(text()).not.toContain('¿Cancelar el pedido #42?');
    });

    it('says that it is cancelling and ignores another tap meanwhile', async () => {
      await openWith(PENDING);

      await confirmCancellation();

      const working = requireButton('Cancelando…');
      expect(working.getAttribute('aria-disabled')).toBe('true');
      working.click();
      await fixture.whenStable();
      const request = httpTesting.expectOne(CANCEL_URL);
      expect(request.request.method).toBe('POST');
      request.flush(CANCELLED);
      await fixture.whenStable();
    });

    it('shows the order the backend cancelled and announces it', async () => {
      await openWith(PENDING);
      await confirmCancellation();

      httpTesting.expectOne(CANCEL_URL).flush(CANCELLED);
      await fixture.whenStable();

      expect(status()).toBe('Cancelado');
      expect(button('Cancelar pedido')).toBeUndefined();
      expect(notice()?.querySelector('[role]')).toBeNull();
      expect(notice()?.textContent).toContain('Cancelaste el pedido #42.');
      expect(announced()).toEqual(['Cancelaste el pedido #42.']);
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('warns that the order already changed and shows how it is now', async () => {
      await openWith(PENDING);
      await confirmCancellation();

      httpTesting
        .expectOne(CANCEL_URL)
        .flush(
          { status: 409, detail: 'Conflicto', code: 'order.invalid_transition' },
          { status: 409, statusText: 'Conflict' },
        );
      await fixture.whenStable();
      httpTesting.expectOne(ORDER_URL).flush(ACCEPTED);
      await fixture.whenStable();

      expect(notice()?.textContent).toContain(
        'Tu pedido ya cambió de estado y no se puede cancelar',
      );
      expect(status()).toBe('Aceptado');
      expect(button('Cancelar pedido')).toBeUndefined();
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('offers to retry when the order cannot load again after it changed', async () => {
      await openWith(PENDING);
      await confirmCancellation();

      httpTesting
        .expectOne(CANCEL_URL)
        .flush(
          { status: 409, detail: 'Conflicto', code: 'order.invalid_transition' },
          { status: 409, statusText: 'Conflict' },
        );
      await fixture.whenStable();
      httpTesting
        .expectOne(ORDER_URL)
        .flush(
          { status: 500, detail: 'Detalle del servidor' },
          { status: 500, statusText: 'Error' },
        );
      await fixture.whenStable();

      expect(page().querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar tu pedido',
      );
      expect(button('Cancelar pedido')).toBeUndefined();
      expect(document.activeElement).toBe(requireButton('Reintentar'));
    });

    it.each([
      [404, 'order.not_found'],
      [403, 'order.not_owner'],
    ])(
      'shows that the order is not there when the cancellation answers %s',
      async (code, problemCode) => {
        await openWith(PENDING);
        await confirmCancellation();

        httpTesting
          .expectOne(CANCEL_URL)
          .flush(
            { status: code, detail: 'Detalle', code: problemCode },
            { status: code, statusText: 'Error' },
          );
        await fixture.whenStable();

        expect(page().querySelector('h1')?.textContent?.trim()).toBe('No encontramos este pedido');
        expect(document.activeElement).toBe(page().querySelector('h1'));
      },
    );

    it('keeps the order as it was when the cancellation fails', async () => {
      await openWith(PENDING);
      await confirmCancellation();

      httpTesting
        .expectOne(CANCEL_URL)
        .flush(
          { status: 500, detail: 'Detalle del servidor' },
          { status: 500, statusText: 'Error' },
        );
      await fixture.whenStable();

      expect(notice()?.querySelector('[role="alert"]')).toBeTruthy();
      expect(notice()?.textContent).toContain('Detalle del servidor');
      expect(status()).toBe('Pendiente');
      expect(requireButton('Cancelar pedido').getAttribute('aria-disabled')).toBe('false');
    });
  });
  describe('live', () => {
    const EVENTS_URL = '/api/v1/orders/events';

    function source() {
      return events.latest(EVENTS_URL);
    }

    async function hear(orderId: number, status: Order['status']): Promise<void> {
      source().emit('order', { orderId, status });
      await fixture.whenStable();
    }

    async function followUpWith(order: Order): Promise<void> {
      httpTesting.expectOne(ORDER_URL).flush(order);
      await fixture.whenStable();
    }

    it('shows the progress of an order that is moving forward', async () => {
      await openWith(ACCEPTED);

      const steps = Array.from(page().querySelectorAll('ol[aria-label="Progreso del pedido"] li'));
      expect(steps.map((step) => step.querySelector('.sr-only')?.textContent?.trim())).toEqual([
        'Pendiente: hecho',
        'Aceptado: paso actual',
        'En preparación: pendiente',
        'Listo: pendiente',
        'Completado: pendiente',
      ]);
      expect(steps[1].getAttribute('aria-current')).toBe('step');
      expect(
        page().querySelector('[data-progress-summary]')?.textContent?.replace(/\s+/g, ' ').trim(),
      ).toBe('Paso 2 de 5 · Aceptado');
    });

    it('shows the order as soon as the restaurant changes it and announces it', async () => {
      await openWith(PENDING);
      source().connect();
      const heading = page().querySelector<HTMLElement>('h1');
      heading?.focus();

      await hear(42, 'ACCEPTED');
      await followUpWith(ACCEPTED);

      expect(status()).toBe('Aceptado');
      expect(button('Cancelar pedido')).toBeUndefined();
      expect(announced()).toEqual(['La Casona aceptó tu pedido #42.']);
      expect(document.activeElement).toBe(heading);
    });

    it('highlights an order that is ready to pick up, also in the tab', async () => {
      await openWith({ ...PENDING, status: 'IN_PREPARATION' });

      await hear(42, 'READY');
      await followUpWith({ ...PENDING, status: 'READY' });

      expect(
        page().querySelector('[data-ready-panel]')?.textContent?.replace(/\s+/g, ' '),
      ).toContain('¡Tu pedido está listo! Retíralo en La Casona y págalo en el local.');
      expect(page().querySelector('[data-hint]')).toBeNull();
      expect(announced()).toEqual(['¡Tu pedido #42 está listo! Retíralo en La Casona.']);
      expect(TestBed.inject(Title).getTitle()).toBe('¡Listo! Pedido #42 | Pedidos');
    });

    it('explains a rejection and offers other restaurants', async () => {
      await openWith(PENDING);

      await hear(42, 'REJECTED');
      await followUpWith({ ...PENDING, status: 'REJECTED' });

      const panel = page().querySelector('[data-rejected-panel]');
      expect(panel?.textContent).toContain('La Casona no pudo tomar tu pedido');
      expect(panel?.querySelector('a')?.getAttribute('href')).toBe('/restaurantes');
      expect(page().querySelector('ol[aria-label="Progreso del pedido"]')).toBeNull();
    });

    it('closes the question to cancel when the restaurant accepts meanwhile', async () => {
      await openWith(PENDING);
      requireButton('Cancelar pedido').click();
      await fixture.whenStable();
      expect(document.activeElement).toBe(requireButton('Mantener pedido'));

      await hear(42, 'ACCEPTED');
      await followUpWith(ACCEPTED);

      expect(page().querySelector('app-confirm-panel')).toBeNull();
      expect(notice()?.textContent).toContain(
        'La Casona ya aceptó tu pedido. Ya no se puede cancelar.',
      );
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('ignores the news of other orders and of its own cancellation', async () => {
      await openWith(PENDING);

      await hear(43, 'ACCEPTED');
      httpTesting.expectNone(ORDER_URL);
      await confirmCancellation();
      httpTesting.expectOne(CANCEL_URL).flush(CANCELLED);
      await fixture.whenStable();
      await hear(42, 'CANCELLED');

      httpTesting.expectNone(ORDER_URL);
    });

    it('loads the order again when it reconnects', async () => {
      await openWith(PENDING);
      source().connect();

      source().drop();
      source().connect();
      await fixture.whenStable();
      await followUpWith(PENDING);

      expect(status()).toBe('Pendiente');
      expect(announced()).toEqual([]);
    });
  });
});
