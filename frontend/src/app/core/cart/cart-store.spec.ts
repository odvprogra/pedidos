import { TestBed } from '@angular/core/testing';
import { Cart, CartRestaurant } from './cart';
import { CART_STORAGE_KEY, CartStore } from './cart-store';

const LA_CASONA: CartRestaurant = { id: 4, name: 'La Casona', address: 'Calle Sucre 245' };
const EL_FOGON: CartRestaurant = { id: 5, name: 'El Fogón', address: 'Av. Banzer 120' };
const SILPANCHO = { id: 10, name: 'Silpancho', price: 45 };
const LEMONADE = { id: 12, name: 'Limonada', price: 10.5 };
const NAPOLITANA = { id: 20, name: 'Napolitana', price: 70 };

describe('CartStore', () => {
  afterEach(() => localStorage.clear());

  function store(): CartStore {
    return TestBed.inject(CartStore);
  }

  function stored(): Cart | null {
    const value = localStorage.getItem(CART_STORAGE_KEY);
    return value === null ? null : (JSON.parse(value) as Cart);
  }

  it('starts empty when nothing was stored', () => {
    expect(store().restaurant()).toBeNull();
    expect(store().items()).toEqual([]);
    expect(store().count()).toBe(0);
    expect(store().subtotal()).toBe(0);
  });

  it('keeps the cart that was stored before a reload', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        restaurant: LA_CASONA,
        items: [{ productId: 10, name: 'Silpancho', price: 45, quantity: 2 }],
      }),
    );

    expect(store().restaurant()).toEqual(LA_CASONA);
    expect(store().count()).toBe(2);
    expect(store().subtotal()).toBe(90);
  });

  it.each(['{"restaurant":', '{"restaurant": {"id": 4}, "items": []}'])(
    'starts empty when the stored cart cannot be read: %s',
    (value) => {
      localStorage.setItem(CART_STORAGE_KEY, value);

      expect(store().restaurant()).toBeNull();
      expect(store().count()).toBe(0);
    },
  );

  it('adds products of the restaurant and stores them', () => {
    expect(store().add(LA_CASONA, SILPANCHO)).toBe('added');
    store().add(LA_CASONA, LEMONADE);
    store().add(LA_CASONA, SILPANCHO);

    expect(store().quantityOf(10)).toBe(2);
    expect(store().quantityOf(12)).toBe(1);
    expect(store().count()).toBe(3);
    expect(store().subtotal()).toBe(100.5);
    expect(stored()).toEqual({
      restaurant: LA_CASONA,
      items: [
        { productId: 10, name: 'Silpancho', price: 45, quantity: 2 },
        { productId: 12, name: 'Limonada', price: 10.5, quantity: 1 },
      ],
    });
  });

  it('does not mix products of another restaurant', () => {
    store().add(LA_CASONA, SILPANCHO);

    expect(store().add(EL_FOGON, NAPOLITANA)).toBe('other-restaurant');
    expect(store().restaurant()).toEqual(LA_CASONA);
    expect(store().quantityOf(20)).toBe(0);
  });

  it('starts a new cart with a product of another restaurant', () => {
    store().add(LA_CASONA, SILPANCHO);

    store().replaceWith(EL_FOGON, NAPOLITANA);

    expect(store().restaurant()).toEqual(EL_FOGON);
    expect(store().items()).toEqual([
      { productId: 20, name: 'Napolitana', price: 70, quantity: 1 },
    ]);
    expect(stored()?.restaurant).toEqual(EL_FOGON);
  });

  it('changes the quantity of a product', () => {
    store().add(LA_CASONA, SILPANCHO);

    store().setQuantity(10, 4);

    expect(store().quantityOf(10)).toBe(4);
    expect(stored()?.items[0].quantity).toBe(4);
  });

  it('forgets the restaurant when the last product is removed', () => {
    store().add(LA_CASONA, SILPANCHO);
    store().add(LA_CASONA, LEMONADE);

    store().remove(10);
    expect(
      store()
        .items()
        .map((item) => item.name),
    ).toEqual(['Limonada']);

    store().remove(12);
    expect(store().restaurant()).toBeNull();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('empties the cart and its stored copy', () => {
    store().add(LA_CASONA, SILPANCHO);

    store().clear();

    expect(store().count()).toBe(0);
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('keeps working when the browser refuses to store the cart', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Lleno', 'QuotaExceededError');
    });

    expect(store().add(LA_CASONA, SILPANCHO)).toBe('added');
    expect(store().count()).toBe(1);
    setItem.mockRestore();
  });
});
