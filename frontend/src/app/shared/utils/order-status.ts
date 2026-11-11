export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'READY' | 'PICKED_UP' | 'REJECTED' | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'En preparación',
  READY: 'Listo para retirar',
  PICKED_UP: 'Retirado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};
