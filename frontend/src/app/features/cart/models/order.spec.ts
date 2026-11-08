import { orderRequestOf } from './order';

describe('order', () => {
  it('sends only the restaurant, the products and their quantities', () => {
    const request = orderRequestOf(4, [
      { productId: 10, name: 'Silpancho', price: 45, quantity: 2 },
      { productId: 12, name: 'Limonada', price: 10.5, quantity: 1 },
    ]);

    expect(request).toEqual({
      restaurantId: 4,
      items: [
        { productId: 10, quantity: 2 },
        { productId: 12, quantity: 1 },
      ],
    });
  });
});
