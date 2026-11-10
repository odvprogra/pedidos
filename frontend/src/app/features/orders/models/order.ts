import { describeUnits } from '@shared/utils/describe-units';
import { OrderStatus } from '@shared/utils/order-status';

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

export function describeItems(order: Order): string {
  return describeUnits(order.items.reduce((units, item) => units + item.quantity, 0));
}

export function canCancel(order: Order): boolean {
  return order.status === 'PLACED';
}

export function isInProgress(order: Order): boolean {
  return order.status === 'PLACED' || order.status === 'ACCEPTED';
}

export function statusHint(order: Order): string {
  const restaurant = order.restaurantName;
  switch (order.status) {
    case 'PLACED':
      return `Esperando que ${restaurant} lo acepte. Puedes cancelarlo mientras tanto.`;
    case 'ACCEPTED':
      return `${restaurant} lo está preparando. Ya no se puede cancelar.`;
    case 'READY':
      return `¡Ya está listo! Retíralo en ${restaurant} y págalo en el local.`;
    case 'PICKED_UP':
      return 'Ya lo retiraste. ¡Buen provecho!';
    case 'REJECTED':
      return `${restaurant} no pudo tomar tu pedido. Puedes pedir en otro restaurante.`;
    case 'CANCELLED':
      return 'Cancelaste este pedido.';
  }
}

export function countOrders(total: number): string {
  return total === 1 ? '1 pedido' : `${total} pedidos`;
}
