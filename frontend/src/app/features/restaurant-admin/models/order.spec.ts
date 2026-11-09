import { OrderStatus } from '@shared/utils/order-status';
import { ORDER_FILTERS, Order, actionsFor, copyFor, emptyCopyFor } from './order';

function orderIn(status: OrderStatus): Order {
  return {
    id: 42,
    restaurantId: 4,
    restaurantName: 'La Casona',
    status,
    total: 90,
    placedAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:00:00Z',
    items: [{ productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 }],
  };
}

describe('the orders of the restaurant', () => {
  it('splits the statuses between the orders in progress and the finished ones', () => {
    expect(ORDER_FILTERS.active).toEqual({
      label: 'En curso',
      statuses: ['PLACED', 'ACCEPTED', 'READY'],
    });
    expect(ORDER_FILTERS.finished).toEqual({
      label: 'Terminados',
      statuses: ['PICKED_UP', 'REJECTED', 'CANCELLED'],
    });
  });

  it.each([
    ['PLACED', ['reject', 'accept']],
    ['ACCEPTED', ['mark-ready']],
    ['READY', ['mark-picked-up']],
    ['PICKED_UP', []],
    ['REJECTED', []],
    ['CANCELLED', []],
  ] as const)('offers the next steps of an order in %s', (status, actions) => {
    expect(actionsFor(orderIn(status))).toEqual(actions);
  });

  it.each([
    ['accept', 'Aceptar', 'Aceptando…', 'Aceptaste el pedido #42.'],
    ['reject', 'Rechazar', 'Rechazando…', 'Rechazaste el pedido #42.'],
    ['mark-ready', 'Marcar listo', 'Marcando listo…', 'El pedido #42 está listo.'],
    ['mark-picked-up', 'Entregar', 'Entregando…', 'Entregaste el pedido #42.'],
  ] as const)('names the action %s and what it did', (action, label, working, done) => {
    const copy = copyFor(action);

    expect(copy.label).toBe(label);
    expect(copy.working).toBe(working);
    expect(copy.done(42)).toContain(done);
  });

  it('explains an empty list in the words of each filter', () => {
    expect(emptyCopyFor('active').heading).toBe('No tienes pedidos en curso');
    expect(emptyCopyFor('finished').heading).toBe('Todavía no hay pedidos terminados');
  });
});
