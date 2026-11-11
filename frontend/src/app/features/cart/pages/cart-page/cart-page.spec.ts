import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Account } from '@core/auth/account';
import { SessionStore } from '@core/auth/session-store';
import { CartRestaurant } from '@core/cart/cart';
import { CartStore } from '@core/cart/cart-store';
import { Order } from '../../models/order';
import { CartPage } from './cart-page';

const ORDERS_URL = '/api/v1/orders';
const LA_CASONA: CartRestaurant = { id: 4, name: 'La Casona', address: 'Calle Sucre 245' };
const ANA: Account = { id: 7, name: 'Ana Rojas', email: 'ana@correo.com', role: 'CUSTOMER' };
const OWNER: Account = { id: 3, name: 'Luis Pérez', email: 'luis@correo.com', role: 'OWNER' };
const PLACED: Order = {
  id: 42,
  restaurantId: 4,
  restaurantName: 'La Casona',
  status: 'PLACED',
  total: 110.5,
  placedAt: '2026-11-08T15:00:00Z',
  updatedAt: '2026-11-08T15:00:00Z',
  items: [
    { productId: 10, productName: 'Silpancho', unitPrice: 50, quantity: 2, subtotal: 100 },
    { productId: 12, productName: 'Limonada', unitPrice: 10.5, quantity: 1, subtotal: 10.5 },
  ],
};

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let httpTesting: HttpTestingController;
  let cart: CartStore;
  let session: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartStore);
    session = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  async function openAs(account: Account | null): Promise<void> {
    if (account) {
      session.signIn(account);
    } else {
      session.clear();
    }
    fixture = TestBed.createComponent(CartPage);
    await fixture.whenStable();
  }

  function fillCart(): void {
    cart.add(LA_CASONA, { id: 10, name: 'Silpancho', price: 45 });
    cart.add(LA_CASONA, { id: 10, name: 'Silpancho', price: 45 });
    cart.add(LA_CASONA, { id: 12, name: 'Limonada', price: 10.5 });
  }

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  function textOf(selector: string): string {
    return (page().querySelector(selector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  function lines(): string[] {
    return Array.from(page().querySelectorAll('app-cart-line h3'), (name) =>
      (name.textContent ?? '').trim(),
    );
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

  function link(label: string): HTMLAnchorElement {
    const found = Array.from(page().querySelectorAll('a')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!found) {
      throw new Error(`No link says ${label}`);
    }
    return found;
  }

  function alert(): HTMLElement | null {
    return page().querySelector('[role="alert"]');
  }

  async function click(target: HTMLElement): Promise<void> {
    target.click();
    await fixture.whenStable();
  }

  async function failWith(status: number, code?: string): Promise<void> {
    httpTesting
      .expectOne(ORDERS_URL)
      .flush({ status, detail: 'Detalle del servidor', code }, { status, statusText: 'Error' });
    await fixture.whenStable();
  }

  describe('an empty cart', () => {
    it('invites to look for restaurants', async () => {
      await openAs(ANA);

      expect(textOf('h1')).toBe('Tu carrito');
      expect(text()).toContain('Tu carrito está vacío');
      expect(link('Ver restaurantes').getAttribute('href')).toBe('/restaurantes');
      expect(page().querySelector('app-cart-line')).toBeNull();
    });
  });

  describe('a cart with products', () => {
    beforeEach(() => fillCart());

    it('lists the products of the restaurant with the estimated subtotal', async () => {
      await openAs(ANA);

      expect(lines()).toEqual(['Silpancho', 'Limonada']);
      expect(link('La Casona').getAttribute('href')).toBe('/restaurantes/4');
      expect(textOf('[data-cart-units]')).toBe('3');
      expect(textOf('[data-cart-subtotal]')).toBe('Bs 100,50');
      expect(text()).toContain('Retiras en Calle Sucre 245');
    });

    it('updates the subtotal when a quantity changes', async () => {
      await openAs(ANA);

      await click(page().querySelector('[data-increase]') as HTMLElement);

      expect(cart.quantityOf(10)).toBe(3);
      expect(textOf('[data-cart-subtotal]')).toBe('Bs 145,50');
      expect(textOf('[data-cart-announcement]')).toBe(
        'Silpancho: 3 unidades. Subtotal estimado Bs 145,50.',
      );
    });

    it('removes a product, says so and takes the focus to the next one', async () => {
      await openAs(ANA);

      await click(button('Quitar Silpancho'));

      expect(lines()).toEqual(['Limonada']);
      expect(textOf('[data-cart-announcement]')).toBe(
        'Quitaste Silpancho del carrito. Tienes 1 producto.',
      );
      expect(document.activeElement).toBe(button('Quitar Limonada'));
    });

    it('takes the focus to the previous product when the last one is removed', async () => {
      await openAs(ANA);

      await click(button('Quitar Limonada'));

      expect(document.activeElement).toBe(button('Quitar Silpancho'));
    });

    it('shows the empty cart once the last product is removed', async () => {
      await openAs(ANA);

      await click(button('Quitar Silpancho'));
      await click(button('Quitar Limonada'));

      expect(text()).toContain('Tu carrito está vacío');
      expect(textOf('[data-cart-announcement]')).toBe('Quitaste Limonada. Tu carrito quedó vacío.');
      expect(cart.restaurant()).toBeNull();
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });

    it('asks a visitor to log in and come back to the cart', async () => {
      await openAs(null);

      expect(link('Ingresar para confirmar').getAttribute('href')).toBe(
        '/ingresar?returnUrl=%2Fcarrito',
      );
      expect(link('Crea una').getAttribute('href')).toBe('/registro?returnUrl=%2Fcarrito');
      expect(page().querySelector('button[appButton]')).toBeNull();
    });

    it('tells an owner that only customers place orders', async () => {
      await openAs(OWNER);

      expect(alert()?.textContent).toContain('Solo las cuentas de cliente pueden hacer pedidos');
      expect(text()).not.toContain('Confirmar pedido');
      expect(text()).not.toContain('Ingresar para confirmar');
    });

    it('lets an owner only empty the cart', async () => {
      await openAs(OWNER);

      expect(button('Quitar Silpancho').getAttribute('aria-disabled')).toBe('true');
      expect(text()).not.toContain('Agregar más productos');

      await click(button('Vaciar carrito'));

      expect(cart.count()).toBe(0);
      expect(text()).toContain('Tu carrito está vacío');
      expect(document.activeElement).toBe(page().querySelector('h1'));
    });
  });

  describe('placing the order', () => {
    beforeEach(async () => {
      fillCart();
      await openAs(ANA);
    });

    it('sends only the restaurant, the products and their quantities', async () => {
      await click(button('Confirmar pedido'));

      const request = httpTesting.expectOne(ORDERS_URL);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({
        restaurantId: 4,
        items: [
          { productId: 10, quantity: 2 },
          { productId: 12, quantity: 1 },
        ],
      });
      request.flush(PLACED);
    });

    it('shows that it is working and ignores a second tap', async () => {
      await click(button('Confirmar pedido'));
      await click(button('Confirmando pedido…'));

      expect(button('Confirmando pedido…').getAttribute('aria-disabled')).toBe('true');
      expect(page().querySelector('[data-increase]')?.getAttribute('aria-disabled')).toBe('true');
      expect(textOf('[role="status"]')).toBe('Confirmando tu pedido…');
      httpTesting.expectOne(ORDERS_URL).flush(PLACED);
    });

    it('confirms the order with the total of the backend and empties the cart', async () => {
      await click(button('Confirmar pedido'));
      httpTesting.expectOne(ORDERS_URL).flush(PLACED);
      await fixture.whenStable();

      expect(textOf('h1')).toBe('¡Pedido confirmado!');
      expect(textOf('h2')).toBe('Pedido #42');
      expect(textOf('[data-total]')).toBe('Bs 110,50');
      expect(text()).toContain('Retíralo en Calle Sucre 245');
      expect(cart.count()).toBe(0);
      expect(document.activeElement).toBe(page().querySelector('h1'));
      expect(TestBed.inject(Title).getTitle()).toBe('Pedido confirmado | Pedidos');
    });

    it('keeps the cart and says so when the restaurant is not taking orders', async () => {
      await click(button('Confirmar pedido'));
      await failWith(422, 'order.restaurant_unavailable');

      expect(alert()?.textContent).toContain(
        'La Casona no está recibiendo pedidos ahora. Tu carrito queda guardado para cuando abra.',
      );
      expect(cart.count()).toBe(3);
      expect(button('Confirmar pedido').getAttribute('aria-disabled')).toBe('false');
    });

    it('sends the customer back to the menu when a product cannot be ordered', async () => {
      await click(button('Confirmar pedido'));
      await failWith(422, 'order.product_unavailable');

      expect(alert()?.textContent).toContain('se agotó o ya no está en el menú');
      expect(link('Revisar el menú').getAttribute('href')).toBe('/restaurantes/4');
      expect(lines()).toEqual(['Silpancho', 'Limonada']);
    });

    it('explains that the server cannot be reached and lets the customer try again', async () => {
      await click(button('Confirmar pedido'));
      httpTesting.expectOne(ORDERS_URL).error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(alert()?.textContent).toContain('No hay conexión');

      await click(button('Confirmar pedido'));
      httpTesting.expectOne(ORDERS_URL).flush(PLACED);
      await fixture.whenStable();

      expect(textOf('h1')).toBe('¡Pedido confirmado!');
    });

    it('drops the error once the cart changes', async () => {
      await click(button('Confirmar pedido'));
      await failWith(422, 'order.product_unavailable');

      await click(button('Quitar Silpancho'));

      expect(alert()).toBeNull();
    });
  });
});
