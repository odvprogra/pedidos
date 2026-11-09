import { describeOrderError, isOrderChanged } from './order-error';

describe('the errors of the orders of the restaurant', () => {
  it('recognizes an order that already changed its status', () => {
    expect(isOrderChanged({ status: 409, detail: '', code: 'order.invalid_transition' })).toBe(
      true,
    );
    expect(isOrderChanged({ status: 404, detail: '', code: 'order.not_found' })).toBe(false);
  });

  it.each([
    ['order.not_found', 'Ese pedido ya no existe.'],
    ['order.not_owner', 'Ese pedido es de otro restaurante.'],
    ['access_denied', 'Solo el dueño del restaurante atiende sus pedidos.'],
  ])('explains %s in its own words', (code, message) => {
    expect(describeOrderError({ status: 400, detail: 'Detalle', code })).toBe(message);
  });

  it('shows the detail of the backend for the errors it does not know', () => {
    expect(describeOrderError({ status: 500, detail: 'Detalle del servidor' })).toBe(
      'Detalle del servidor',
    );
  });
});
