import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { formatDateTime } from '@shared/utils/format-date-time';
import { Order } from '../../models/order';
import { OrderRow } from './order-row';

const ORDER: Order = {
  id: 42,
  restaurantId: 4,
  restaurantName: 'La Casona',
  status: 'READY',
  total: 100.5,
  placedAt: '2026-11-08T15:00:00Z',
  updatedAt: '2026-11-08T15:20:00Z',
  items: [
    { productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 },
    { productId: 12, productName: 'Limonada', unitPrice: 10.5, quantity: 1, subtotal: 10.5 },
  ],
};

describe('OrderRow', () => {
  let fixture: ComponentFixture<OrderRow>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(OrderRow);
    fixture.componentRef.setInput('order', ORDER);
    await fixture.whenStable();
  });

  function row(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('links to the detail of the order', () => {
    expect(row().querySelector('a')?.getAttribute('href')).toBe('/pedidos/42');
  });

  it('names the order by its number and its restaurant', () => {
    expect(row().querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Pedido #42 · La Casona',
    );
  });

  it('shows the status of the order', () => {
    expect(row().querySelector('[data-status]')?.textContent?.trim()).toBe('Listo para retirar');
  });

  it('shows when it was placed in local time, how many units it has and its total', () => {
    const time = row().querySelector('time') as HTMLTimeElement;

    expect(time.getAttribute('datetime')).toBe('2026-11-08T15:00:00Z');
    expect(time.textContent?.trim()).toBe(formatDateTime('2026-11-08T15:00:00Z'));
    expect(row().textContent).toContain('3 productos');
    expect(row().querySelector('[data-total]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Total: Bs 100,50',
    );
  });
});
