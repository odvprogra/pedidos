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

export type OrderFilter = 'active' | 'finished';

export const ORDER_FILTERS: Record<OrderFilter, { label: string; statuses: OrderStatus[] }> = {
  active: { label: 'En curso', statuses: ['PLACED', 'ACCEPTED', 'READY'] },
  finished: { label: 'Terminados', statuses: ['PICKED_UP', 'REJECTED', 'CANCELLED'] },
};

export type OrderAction = 'reject' | 'accept' | 'mark-ready' | 'mark-picked-up';

const ACTIONS: Record<OrderStatus, OrderAction[]> = {
  PLACED: ['reject', 'accept'],
  ACCEPTED: ['mark-ready'],
  READY: ['mark-picked-up'],
  PICKED_UP: [],
  REJECTED: [],
  CANCELLED: [],
};

export function actionsFor(order: Order): OrderAction[] {
  return ACTIONS[order.status];
}

interface ActionCopy {
  label: string;
  working: string;
  done: (id: number) => string;
}

const COPY: Record<OrderAction, ActionCopy> = {
  accept: {
    label: 'Aceptar',
    working: 'Aceptando…',
    done: (id) => `Aceptaste el pedido #${id}. Ya figura en preparación para el cliente.`,
  },
  reject: {
    label: 'Rechazar',
    working: 'Rechazando…',
    done: (id) => `Rechazaste el pedido #${id}.`,
  },
  'mark-ready': {
    label: 'Marcar listo',
    working: 'Marcando listo…',
    done: (id) => `El pedido #${id} está listo. El cliente ya lo ve para retirar.`,
  },
  'mark-picked-up': {
    label: 'Entregar',
    working: 'Entregando…',
    done: (id) => `Entregaste el pedido #${id}.`,
  },
};

export function copyFor(action: OrderAction): ActionCopy {
  return COPY[action];
}

export function emptyCopyFor(filter: OrderFilter): { heading: string; message: string } {
  return filter === 'active'
    ? {
        heading: 'No tienes pedidos en curso',
        message: 'Cuando un cliente confirme un pedido, aparece aquí para que lo aceptes.',
      }
    : {
        heading: 'Todavía no hay pedidos terminados',
        message: 'Aquí quedan los pedidos entregados, rechazados y cancelados.',
      };
}
