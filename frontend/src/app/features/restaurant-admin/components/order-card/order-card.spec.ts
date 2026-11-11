import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { formatDateTime } from '@shared/utils/format-date-time';
import { OrderStatus } from '@shared/utils/order-status';
import { Order, OrderAction } from '../../models/order';
import { OrderCard } from './order-card';

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

@Component({
  imports: [OrderCard],
  template: `<app-order-card
    [order]="order()"
    [working]="working()"
    [locked]="locked()"
    (acted)="acted.push($event)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly card = viewChild.required(OrderCard);
  readonly order = signal<Order>(PENDING);
  readonly working = signal<OrderAction | null>(null);
  readonly locked = signal(false);
  readonly acted: OrderAction[] = [];
}

describe('OrderCard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  function card(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function text(): string {
    return (card().textContent ?? '').replace(/\s+/g, ' ');
  }

  function actions(): string[] {
    return Array.from(card().querySelectorAll('button[data-action]'), (button) =>
      (button.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(card().querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    );
    if (!found) {
      throw new Error(`No button says ${label}`);
    }
    return found;
  }

  async function showIn(status: OrderStatus): Promise<void> {
    host.order.set({ ...PENDING, status });
    await fixture.whenStable();
  }

  it('shows the number, the time, the status, the items and the total', () => {
    expect(card().querySelector('h2')?.textContent?.trim()).toBe('Pedido #42');
    expect(card().querySelector('time')?.textContent?.trim()).toBe(
      formatDateTime('2026-11-08T15:00:00Z'),
    );
    expect(card().querySelector('[data-status]')?.textContent?.trim()).toBe('Pendiente');
    const items = Array.from(card().querySelectorAll('[data-item]'), (item) =>
      item.textContent?.replace(/\s+/g, ' ').trim(),
    );
    expect(items).toEqual(['2 × Silpancho Bs 90,00', '1 × Limonada Bs 10,50']);
    expect(card().querySelector('[data-total]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Bs 100,50',
    );
  });

  it.each([
    ['PLACED', ['Rechazar el pedido #42', 'Aceptar el pedido #42']],
    ['ACCEPTED', ['Marcar listo el pedido #42']],
    ['READY', ['Entregar el pedido #42']],
    ['PICKED_UP', []],
    ['REJECTED', []],
    ['CANCELLED', []],
  ] as const)('offers the next steps of an order in %s', async (status, labels) => {
    await showIn(status);

    expect(actions()).toEqual(labels);
  });

  it.each([
    ['ACCEPTED', 'Marcar listo', 'mark-ready'],
    ['READY', 'Entregar', 'mark-picked-up'],
    ['PLACED', 'Aceptar', 'accept'],
  ] as const)('runs a step of an order in %s without asking', async (status, label, action) => {
    await showIn(status);

    button(label).click();
    await fixture.whenStable();

    expect(host.acted).toEqual([action]);
  });

  it('ignores the second click of a double click, so it never runs two steps', async () => {
    await showIn('ACCEPTED');

    button('Marcar listo').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    button('Marcar listo').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 2 }));
    await fixture.whenStable();

    expect(host.acted).toEqual(['mark-ready']);
  });

  it('asks before rejecting and takes the focus to keeping the order', async () => {
    button('Rechazar').click();
    await fixture.whenStable();

    expect(text()).toContain('¿Rechazar el pedido #42?');
    expect(text()).toContain('El cliente lo verá como rechazado. Esto no se puede deshacer.');
    expect(button('Rechazar').getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(button('Mantener pedido'));
    expect(host.acted).toEqual([]);
  });

  it('rejects once the owner confirms and returns the focus to the button', async () => {
    button('Rechazar').click();
    await fixture.whenStable();

    button('Sí, rechazar').click();
    await fixture.whenStable();

    expect(host.acted).toEqual(['reject']);
    expect(text()).not.toContain('¿Rechazar el pedido #42?');
    expect(document.activeElement).toBe(button('Rechazar'));
  });

  it('keeps the order when the owner changes their mind', async () => {
    button('Rechazar').click();
    await fixture.whenStable();

    button('Mantener pedido').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(text()).not.toContain('¿Rechazar el pedido #42?');
    expect(document.activeElement).toBe(button('Rechazar'));
    expect(host.acted).toEqual([]);
  });

  it('closes the question when the owner accepts instead', async () => {
    button('Rechazar').click();
    await fixture.whenStable();

    button('Aceptar').click();
    await fixture.whenStable();

    expect(host.acted).toEqual(['accept']);
    expect(text()).not.toContain('¿Rechazar el pedido #42?');
  });

  it('closes the question when the order stops being pending', async () => {
    button('Rechazar').click();
    await fixture.whenStable();

    await showIn('CANCELLED');

    expect(text()).not.toContain('¿Rechazar el pedido #42?');
    expect(card().querySelector('app-confirm-panel')).toBeNull();
  });

  it('says what it is doing while a step runs and ignores more taps', async () => {
    host.working.set('accept');
    await fixture.whenStable();

    const working = button('Aceptando…');
    expect(working.getAttribute('aria-disabled')).toBe('true');
    expect(button('Rechazar').getAttribute('aria-disabled')).toBe('true');
    working.click();
    button('Rechazar').click();
    await fixture.whenStable();

    expect(host.acted).toEqual([]);
    expect(text()).not.toContain('¿Rechazar el pedido #42?');
  });

  it('waits while another order is being changed', async () => {
    host.locked.set(true);
    await fixture.whenStable();

    button('Aceptar').click();
    await fixture.whenStable();

    expect(button('Aceptar').getAttribute('aria-disabled')).toBe('true');
    expect(host.acted).toEqual([]);
  });

  it('takes the focus to its first step or, without steps, to its title', async () => {
    host.card().focus();
    expect(document.activeElement).toBe(button('Rechazar'));

    await showIn('PICKED_UP');
    host.card().focus();

    expect(document.activeElement).toBe(card().querySelector('h2'));
  });
});
