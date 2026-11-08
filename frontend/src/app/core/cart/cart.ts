export const CART_SEGMENT = 'carrito';
export const CART_PATH = `/${CART_SEGMENT}`;
export const MAX_QUANTITY = 99;

export interface CartRestaurant {
  id: number;
  name: string;
  address: string;
}

export interface CartProduct {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Cart {
  restaurant: CartRestaurant;
  items: CartItem[];
}

export function startCart(restaurant: CartRestaurant, product: CartProduct): Cart {
  return { restaurant, items: [itemOf(product)] };
}

export function addProduct(cart: Cart, product: CartProduct): Cart {
  const current = cart.items.find((item) => item.productId === product.id);
  if (!current) {
    return { ...cart, items: [...cart.items, itemOf(product)] };
  }
  return withQuantity(cart, product.id, current.quantity + 1);
}

export function withQuantity(cart: Cart, productId: number, quantity: number): Cart {
  const bounded = Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);
  return {
    ...cart,
    items: cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity: bounded } : item,
    ),
  };
}

export function withoutProduct(cart: Cart, productId: number): Cart | null {
  const items = cart.items.filter((item) => item.productId !== productId);
  return items.length > 0 ? { ...cart, items } : null;
}

export function countUnits(cart: Cart | null): number {
  return cart?.items.reduce((units, item) => units + item.quantity, 0) ?? 0;
}

export function lineSubtotal(item: CartItem): number {
  return (toCents(item.price) * item.quantity) / 100;
}

export function estimatedSubtotal(cart: Cart | null): number {
  const cents = cart?.items.reduce((sum, item) => sum + toCents(item.price) * item.quantity, 0);
  return (cents ?? 0) / 100;
}

export function describeUnits(units: number): string {
  return units === 1 ? '1 producto' : `${units} productos`;
}

export function parseCart(value: unknown): Cart | null {
  if (!isRecord(value) || !isRestaurant(value['restaurant']) || !Array.isArray(value['items'])) {
    return null;
  }
  const items: unknown[] = value['items'];
  if (items.length === 0 || !items.every(isItem) || hasRepeatedProducts(items)) {
    return null;
  }
  return { restaurant: value['restaurant'], items };
}

function itemOf(product: CartProduct): CartItem {
  return { productId: product.id, name: product.name, price: product.price, quantity: 1 };
}

function toCents(price: number): number {
  return Math.round(price * 100);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isRestaurant(value: unknown): value is CartRestaurant {
  return (
    isRecord(value) &&
    isId(value['id']) &&
    typeof value['name'] === 'string' &&
    typeof value['address'] === 'string'
  );
}

function isItem(value: unknown): value is CartItem {
  if (!isRecord(value)) {
    return false;
  }
  const { productId, name, price, quantity } = value;
  return (
    isId(productId) &&
    typeof name === 'string' &&
    typeof price === 'number' &&
    Number.isFinite(price) &&
    price > 0 &&
    Number.isInteger(quantity) &&
    (quantity as number) >= 1 &&
    (quantity as number) <= MAX_QUANTITY
  );
}

function hasRepeatedProducts(items: CartItem[]): boolean {
  return new Set(items.map((item) => item.productId)).size < items.length;
}
