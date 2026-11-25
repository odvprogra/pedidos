import { describeUnits } from '@shared/utils/describe-units';
import { ORDER_STATUS_LABELS, OrderStatus } from '@shared/utils/order-status';

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

const IN_PROGRESS: OrderStatus[] = ['PLACED', 'ACCEPTED', 'IN_PREPARATION'];

export function isInProgress(order: Order): boolean {
  return IN_PROGRESS.includes(order.status);
}

export function statusHint(order: Order): string {
  const restaurant = order.restaurantName;
  switch (order.status) {
    case 'PLACED':
      return `Esperando que ${restaurant} lo acepte. Puedes cancelarlo mientras tanto.`;
    case 'ACCEPTED':
      return `${restaurant} aceptó tu pedido y pronto empieza a prepararlo. Ya no se puede cancelar.`;
    case 'IN_PREPARATION':
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

export function liveChangeMessage(order: Order): string {
  const restaurant = order.restaurantName;
  switch (order.status) {
    case 'PLACED':
      return `Confirmaste el pedido #${order.id}.`;
    case 'ACCEPTED':
      return `${restaurant} aceptó tu pedido #${order.id}.`;
    case 'IN_PREPARATION':
      return `${restaurant} está preparando tu pedido #${order.id}.`;
    case 'READY':
      return `¡Tu pedido #${order.id} está listo! Retíralo en ${restaurant}.`;
    case 'PICKED_UP':
      return `Pedido #${order.id} completado. ¡Buen provecho!`;
    case 'REJECTED':
      return `${restaurant} no pudo tomar tu pedido #${order.id}.`;
    case 'CANCELLED':
      return `Cancelaste el pedido #${order.id}.`;
  }
}

export interface ProgressStep {
  status: OrderStatus;
  label: string;
  done: boolean;
  current: boolean;
}

const PROGRESS: OrderStatus[] = ['PLACED', 'ACCEPTED', 'IN_PREPARATION', 'READY', 'PICKED_UP'];

export function progressOf(status: OrderStatus): ProgressStep[] | null {
  const position = PROGRESS.indexOf(status);
  if (position < 0) {
    return null;
  }
  const finished = status === 'PICKED_UP';
  return PROGRESS.map((step, index) => ({
    status: step,
    label: ORDER_STATUS_LABELS[step],
    done: index < position || finished,
    current: index === position && !finished,
  }));
}
