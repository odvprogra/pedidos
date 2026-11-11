import { OrderStatus } from '@shared/utils/order-status';
import { Order, canCancel, countOrders, describeItems, isInProgress, statusHint } from './order';

function orderIn(status: OrderStatus): Order {
  return {
    id: 42,
    restaurantId: 4,
    restaurantName: 'La Casona',
    status,
    total: 100.5,
    placedAt: '2026-11-08T15:00:00Z',
    updatedAt: '2026-11-08T15:00:00Z',
    items: [
      { productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 },
      { productId: 12, productName: 'Limonada', unitPrice: 10.5, quantity: 1, subtotal: 10.5 },
    ],
  };
}

describe('the order of a customer', () => {
  it('counts the units of every item', () => {
    expect(describeItems(orderIn('PLACED'))).toBe('3 productos');
  });

  it('says a single unit in singular', () => {
    const order = { ...orderIn('PLACED'), items: [orderIn('PLACED').items[1]] };

    expect(describeItems(order)).toBe('1 producto');
  });

  it('can be cancelled only while it is pending', () => {
    const statuses: OrderStatus[] = [
      'PLACED',
      'ACCEPTED',
      'READY',
      'PICKED_UP',
      'REJECTED',
      'CANCELLED',
    ];

    expect(statuses.filter((status) => canCancel(orderIn(status)))).toEqual(['PLACED']);
  });

  it('is in progress while it is pending or being prepared', () => {
    const statuses: OrderStatus[] = [
      'PLACED',
      'ACCEPTED',
      'READY',
      'PICKED_UP',
      'REJECTED',
      'CANCELLED',
    ];

    expect(statuses.filter((status) => isInProgress(orderIn(status)))).toEqual([
      'PLACED',
      'ACCEPTED',
    ]);
  });

  it.each([
    ['PLACED', 'Esperando que La Casona lo acepte. Puedes cancelarlo mientras tanto.'],
    ['ACCEPTED', 'La Casona lo está preparando. Ya no se puede cancelar.'],
    ['READY', '¡Ya está listo! Retíralo en La Casona y págalo en el local.'],
    ['PICKED_UP', 'Ya lo retiraste. ¡Buen provecho!'],
    ['REJECTED', 'La Casona no pudo tomar tu pedido. Puedes pedir en otro restaurante.'],
    ['CANCELLED', 'Cancelaste este pedido.'],
  ] as const)('explains what happens with an order in %s', (status, hint) => {
    expect(statusHint(orderIn(status))).toBe(hint);
  });

  it('counts the orders of the history', () => {
    expect(countOrders(1)).toBe('1 pedido');
    expect(countOrders(12)).toBe('12 pedidos');
  });
});
