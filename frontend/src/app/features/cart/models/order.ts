import { CartItem } from '@core/cart/cart';
import { OrderStatus } from '@shared/utils/order-status';

export interface OrderRequest {
  restaurantId: number;
  items: { productId: number; quantity: number }[];
}

export interface OrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  restaurantId: number;
  restaurantName: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export function orderRequestOf(restaurantId: number, items: CartItem[]): OrderRequest {
  return {
    restaurantId,
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  };
}
