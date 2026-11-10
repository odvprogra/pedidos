import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { formatDateTime } from '@shared/utils/format-date-time';
import { Order } from '../../models/order';
import { OrderDetailPage } from './order-detail-page';
import { Announcer } from '@shared/ui/live-region/announcer';

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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
    return page().querySelector('[data-sticky-notice] app-alert > div');
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

      expect(announced()).toEqual(['Cargando tu pedido…']);

      httpTesting.expectOne(ORDER_URL).flush(PENDING);
      await fixture.whenStable();

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

    it.each(['PLACED', 'ACCEPTED'] as const)(
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
    it.each(['ACCEPTED', 'READY', 'PICKED_UP', 'REJECTED', 'CANCELLED'] as const)(
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
      expect(notice()?.hasAttribute('role')).toBe(false);
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
      expect(status()).toBe('En preparación');
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

      expect(notice()?.getAttribute('role')).toBe('alert');
      expect(notice()?.textContent).toContain('Detalle del servidor');
      expect(status()).toBe('Pendiente');
      expect(requireButton('Cancelar pedido').getAttribute('aria-disabled')).toBe('false');
    });
  });
});
