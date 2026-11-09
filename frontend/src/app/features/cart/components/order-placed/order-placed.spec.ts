import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Order } from '../../models/order';
import { OrderPlaced } from './order-placed';

const ORDER: Order = {
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

describe('OrderPlaced', () => {
  let fixture: ComponentFixture<OrderPlaced>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(OrderPlaced);
    fixture.componentRef.setInput('order', ORDER);
    fixture.componentRef.setInput('address', 'Calle Sucre 245');
    await fixture.whenStable();
  });

  function page(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (page().textContent ?? '').replace(/\s+/g, ' ');
  }

  it('confirms the order with its number and its status', () => {
    expect(page().querySelector('h1')?.textContent?.trim()).toBe('¡Pedido confirmado!');
    expect(text()).toContain('La Casona ya recibió tu pedido');
    expect(page().querySelector('h2')?.textContent?.trim()).toBe('Pedido #42');
    expect(page().querySelector('[data-status]')?.textContent?.trim()).toBe('Pendiente');
  });

  it('lists what was ordered with the subtotals and the total of the backend', () => {
    const lines = Array.from(page().querySelectorAll('li'), (line) =>
      line.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(lines).toEqual(['2 × Silpancho Bs 90,00', '1 × Limonada Bs 10,50']);
    const total = page().querySelector('[data-total]') as HTMLElement;
    expect(total.previousElementSibling?.textContent?.trim()).toBe('Total');
    expect(total.textContent?.replace(/\s+/g, ' ').trim()).toBe('Bs 100,50');
  });

  it('says where to pick the order up', () => {
    expect(text()).toContain('Retíralo en Calle Sucre 245');
  });

  it('offers to keep exploring restaurants', () => {
    const link = page().querySelector('a') as HTMLAnchorElement;

    expect(link.textContent?.trim()).toBe('Seguir explorando');
    expect(link.getAttribute('href')).toBe('/restaurantes');
  });

  it('takes the focus to its title', () => {
    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(page().querySelector('h1'));
  });
});
