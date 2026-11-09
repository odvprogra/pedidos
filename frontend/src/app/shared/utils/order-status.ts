import { BadgeTone } from '../ui/badge/badge';

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'READY' | 'PICKED_UP' | 'REJECTED' | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'En preparación',
  READY: 'Listo para retirar',
  PICKED_UP: 'Retirado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};

const ORDER_STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  PLACED: 'warning',
  ACCEPTED: 'info',
  READY: 'success',
  PICKED_UP: 'neutral',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function orderStatusTone(status: OrderStatus): BadgeTone {
  return ORDER_STATUS_TONES[status];
}
