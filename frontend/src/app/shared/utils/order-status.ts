export type OrderStatus =
  'PLACED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'PICKED_UP' | 'REJECTED' | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Pendiente',
  ACCEPTED: 'Aceptado',
  IN_PREPARATION: 'En preparación',
  READY: 'Listo',
  PICKED_UP: 'Completado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Cancelado',
};
