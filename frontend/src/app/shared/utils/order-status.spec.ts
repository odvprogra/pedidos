import { ORDER_STATUS_LABELS } from './order-status';

describe('the order status', () => {
  it('names each status as the data model says', () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      PLACED: 'Pendiente',
      ACCEPTED: 'Aceptado',
      IN_PREPARATION: 'En preparación',
      READY: 'Listo',
      PICKED_UP: 'Completado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
    });
  });
});
