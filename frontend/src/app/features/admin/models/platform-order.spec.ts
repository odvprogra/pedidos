import {
  PlatformOrder,
  countPlatformOrders,
  describePlatformOrderError,
  describeUnitsOf,
  listItemsOf,
} from './platform-order';

const ORDER: PlatformOrder = {
  id: 42,
  restaurantId: 4,
  restaurantName: 'La Casona',
  status: 'PLACED',
  total: 121.5,
  placedAt: '2026-11-08T15:00:00Z',
  updatedAt: '2026-11-08T15:00:00Z',
  items: [
    { productId: 10, productName: 'Silpancho', unitPrice: 45, quantity: 2, subtotal: 90 },
    { productId: 11, productName: 'Limonada', unitPrice: 10.5, quantity: 3, subtotal: 31.5 },
  ],
};

describe('the orders of the platform', () => {
  it.each([
    [1, '1 pedido'],
    [2, '2 pedidos'],
    [120, '120 pedidos'],
  ])('counts %i orders as "%s"', (total, label) => {
    expect(countPlatformOrders(total)).toBe(label);
  });

  it('adds the units of every product of an order', () => {
    expect(describeUnitsOf(ORDER)).toBe('5 productos');
    expect(describeUnitsOf({ ...ORDER, items: [ORDER.items[0]] })).toBe('2 productos');
  });

  it('lists the products of an order with their quantities, in order', () => {
    expect(listItemsOf(ORDER)).toBe('2 × Silpancho, 3 × Limonada');
  });

  it('explains a denied access in its own words and any other error with its detail', () => {
    expect(
      describePlatformOrderError({ status: 403, code: 'access_denied', detail: 'Forbidden' }),
    ).toBe('Tu cuenta no tiene permiso para ver los pedidos de la plataforma.');
    expect(describePlatformOrderError({ status: 500, detail: 'Algo salió mal' })).toBe(
      'Algo salió mal',
    );
  });
});
