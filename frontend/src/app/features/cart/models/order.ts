import { CartItem } from '@core/cart/cart';

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'READY' | 'PICKED_UP' | 'REJECTED' | 'CANCELLED';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'En preparación',
  READY: 'Listo para retirar',
  PICKED_UP: 'Retirado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

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
  items: OrderItem[];
}

export function orderRequestOf(restaurantId: number, items: CartItem[]): OrderRequest {
  return {
    restaurantId,
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
  };
}
