import {
  Cart,
  CartRestaurant,
  MAX_QUANTITY,
  addProduct,
  countUnits,
  estimatedSubtotal,
  lineSubtotal,
  parseCart,
  startCart,
  withQuantity,
  withoutProduct,
} from './cart';

const LA_CASONA: CartRestaurant = { id: 4, name: 'La Casona', address: 'Calle Sucre 245' };
const SILPANCHO = { id: 10, name: 'Silpancho', price: 45 };
const LEMONADE = { id: 12, name: 'Limonada', price: 10.5 };

function cartWith(...items: [number, string, number, number][]): Cart {
  return {
    restaurant: LA_CASONA,
    items: items.map(([productId, name, price, quantity]) => ({
      productId,
      name,
      price,
      quantity,
    })),
  };
}

describe('cart', () => {
  it('starts a cart with one unit of the product', () => {
    expect(startCart(LA_CASONA, SILPANCHO)).toEqual(cartWith([10, 'Silpancho', 45, 1]));
  });

  it('adds a new product at the end with one unit', () => {
    const cart = addProduct(cartWith([10, 'Silpancho', 45, 2]), LEMONADE);

    expect(cart).toEqual(cartWith([10, 'Silpancho', 45, 2], [12, 'Limonada', 10.5, 1]));
  });

  it('adds one more unit of a product that is already in the cart', () => {
    const cart = addProduct(cartWith([10, 'Silpancho', 45, 2]), SILPANCHO);

    expect(cart.items[0].quantity).toBe(3);
  });

  it('never goes over the maximum quantity of a product', () => {
    const cart = addProduct(cartWith([10, 'Silpancho', 45, MAX_QUANTITY]), SILPANCHO);

    expect(cart.items[0].quantity).toBe(99);
  });

  it.each([
    [5, 5],
    [0, 1],
    [-3, 1],
    [120, 99],
    [2.7, 2],
  ])('sets the quantity %d as %d', (quantity, expected) => {
    const cart = withQuantity(
      cartWith([10, 'Silpancho', 45, 1], [12, 'Limonada', 10.5, 1]),
      10,
      quantity,
    );

    expect(cart.items.map((item) => item.quantity)).toEqual([expected, 1]);
  });

  it('removes a product and keeps the rest', () => {
    const cart = withoutProduct(cartWith([10, 'Silpancho', 45, 1], [12, 'Limonada', 10.5, 1]), 10);

    expect(cart).toEqual(cartWith([12, 'Limonada', 10.5, 1]));
  });

  it('leaves no cart when the last product is removed', () => {
    expect(withoutProduct(cartWith([10, 'Silpancho', 45, 1]), 10)).toBeNull();
  });

  it('counts the units of every product', () => {
    expect(countUnits(cartWith([10, 'Silpancho', 45, 2], [12, 'Limonada', 10.5, 3]))).toBe(5);
    expect(countUnits(null)).toBe(0);
  });

  it('estimates the subtotal in cents so the decimals add up', () => {
    const cart = cartWith([10, 'Café', 0.1, 3], [14, 'Sándwich', 0.2, 1]);

    expect(estimatedSubtotal(cart)).toBe(0.5);
    expect(estimatedSubtotal(null)).toBe(0);
  });

  it('gives the subtotal of a line', () => {
    expect(lineSubtotal({ productId: 10, name: 'Café', price: 0.1, quantity: 3 })).toBe(0.3);
  });

  describe('parseCart', () => {
    it('accepts a stored cart', () => {
      const cart = cartWith([10, 'Silpancho', 45, 2]);

      expect(parseCart(JSON.parse(JSON.stringify(cart)))).toEqual(cart);
    });

    it.each([
      ['nothing', null],
      ['a text', 'carrito'],
      ['a cart without restaurant', { items: [] }],
      ['a restaurant without address', { restaurant: { id: 4, name: 'La Casona' }, items: [] }],
      ['a cart without items', { restaurant: LA_CASONA, items: [] }],
      [
        'a quantity of zero',
        {
          restaurant: LA_CASONA,
          items: [{ productId: 10, name: 'Silpancho', price: 45, quantity: 0 }],
        },
      ],
      [
        'a quantity over the maximum',
        {
          restaurant: LA_CASONA,
          items: [{ productId: 10, name: 'Silpancho', price: 45, quantity: 100 }],
        },
      ],
      [
        'a price that is not a number',
        {
          restaurant: LA_CASONA,
          items: [{ productId: 10, name: 'Silpancho', price: '45', quantity: 1 }],
        },
      ],
      [
        'a repeated product',
        {
          restaurant: LA_CASONA,
          items: [
            { productId: 10, name: 'Silpancho', price: 45, quantity: 1 },
            { productId: 10, name: 'Silpancho', price: 45, quantity: 2 },
          ],
        },
      ],
    ])('rejects %s', (_case, value) => {
      expect(parseCart(value)).toBeNull();
    });
  });
});
