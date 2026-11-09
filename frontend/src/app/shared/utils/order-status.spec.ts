import { ORDER_STATUS_LABELS, orderStatusTone } from './order-status';

describe('the order status', () => {
  it.each([
    ['PLACED', 'Pendiente', 'warning'],
    ['ACCEPTED', 'En preparación', 'info'],
    ['READY', 'Listo para retirar', 'success'],
    ['PICKED_UP', 'Retirado', 'neutral'],
    ['REJECTED', 'Rechazado', 'danger'],
    ['CANCELLED', 'Cancelado', 'neutral'],
  ] as const)('shows %s as "%s" in the %s tone', (status, label, tone) => {
    expect(ORDER_STATUS_LABELS[status]).toBe(label);
    expect(orderStatusTone(status)).toBe(tone);
  });
});
