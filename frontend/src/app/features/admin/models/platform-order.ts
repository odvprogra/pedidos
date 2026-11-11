import { ProblemDetails } from '@core/http/problem-details';
import { describeUnits } from '@shared/utils/describe-units';
import { OrderStatus } from '@shared/utils/order-status';

export interface PlatformOrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PlatformOrder {
  id: number;
  restaurantId: number;
  restaurantName: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  updatedAt: string;
  items: PlatformOrderItem[];
}

export function countPlatformOrders(total: number): string {
  return total === 1 ? '1 pedido' : `${total} pedidos`;
}

export function describeUnitsOf(order: PlatformOrder): string {
  return describeUnits(order.items.reduce((units, item) => units + item.quantity, 0));
}

export function listItemsOf(order: PlatformOrder): string {
  return order.items.map((item) => `${item.quantity} × ${item.productName}`).join(', ');
}

const MESSAGES = new Map<string, string>([
  ['access_denied', 'Tu cuenta no tiene permiso para ver los pedidos de la plataforma.'],
]);

export function describePlatformOrderError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
