import { ORDER_STATUS_LABELS } from './order-status';

describe('the order status', () => {
  it('names each status as the data model says', () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      PLACED: 'Pendiente',
      ACCEPTED: 'En preparación',
      READY: 'Listo para retirar',
      PICKED_UP: 'Retirado',
      REJECTED: 'Rechazado',
      CANCELLED: 'Cancelado',
    });
  });
});
