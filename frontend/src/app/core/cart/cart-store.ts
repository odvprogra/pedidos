import { Injectable, computed, signal } from '@angular/core';
import {
  Cart,
  CartProduct,
  CartRestaurant,
  addProduct,
  countUnits,
  estimatedSubtotal,
  parseCart,
  startCart,
  withQuantity,
  withoutProduct,
} from './cart';

export const CART_STORAGE_KEY = 'pedidos.cart';

export type AddResult = 'added' | 'other-restaurant';

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cart = signal<Cart | null>(readStoredCart());

  readonly restaurant = computed(() => this.cart()?.restaurant ?? null);
  readonly items = computed(() => this.cart()?.items ?? []);
  readonly count = computed(() => countUnits(this.cart()));
  readonly subtotal = computed(() => estimatedSubtotal(this.cart()));

  quantityOf(productId: number): number {
    return this.items().find((item) => item.productId === productId)?.quantity ?? 0;
  }

  add(restaurant: CartRestaurant, product: CartProduct): AddResult {
    const cart = this.cart();
    if (cart && cart.restaurant.id !== restaurant.id) {
      return 'other-restaurant';
    }
    this.save(cart ? addProduct(cart, product) : startCart(restaurant, product));
    return 'added';
  }

  replaceWith(restaurant: CartRestaurant, product: CartProduct): void {
    this.save(startCart(restaurant, product));
  }

  setQuantity(productId: number, quantity: number): void {
    const cart = this.cart();
    if (cart) {
      this.save(withQuantity(cart, productId, quantity));
    }
  }

  remove(productId: number): void {
    const cart = this.cart();
    if (cart) {
      this.save(withoutProduct(cart, productId));
    }
  }

  clear(): void {
    this.save(null);
  }

  private save(cart: Cart | null): void {
    this.cart.set(cart);
    writeStoredCart(cart);
  }
}

function readStoredCart(): Cart | null {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored === null ? null : parseCart(JSON.parse(stored));
  } catch {
    return null;
  }
}

function writeStoredCart(cart: Cart | null): void {
  try {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch {
    return;
  }
}
