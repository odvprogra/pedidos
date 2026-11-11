import { ProblemDetails } from '@core/http/problem-details';
import { describeOrderError, isProductUnavailable } from './order-error';

function problem(code: string | undefined, detail = 'Detalle del servidor'): ProblemDetails {
  return { status: 422, detail, code };
}

describe('order errors', () => {
  it('says that the restaurant is not taking orders and that the cart is kept', () => {
    expect(describeOrderError(problem('order.restaurant_unavailable'), 'La Casona')).toBe(
      'La Casona no está recibiendo pedidos ahora. Tu carrito queda guardado para cuando abra.',
    );
  });

  it.each([
    ['order.empty', 'Tu carrito está vacío. Agrega productos antes de confirmar.'],
    ['order.invalid_quantity', 'Cada producto puede ir de 1 a 99 unidades. Revisa las cantidades.'],
    [
      'order.duplicate_product',
      'Un producto aparece dos veces en tu carrito. Quita uno y vuelve a intentar.',
    ],
    [
      'order.product_unavailable',
      'Un producto de tu carrito se agotó o ya no está en el menú. Revisa el menú y vuelve a intentar.',
    ],
    ['access_denied', 'Solo las cuentas de cliente pueden hacer pedidos.'],
  ])('explains %s in Spanish', (code, message) => {
    expect(describeOrderError(problem(code), 'La Casona')).toBe(message);
  });

  it('shows the detail of the server for a code it does not know', () => {
    expect(describeOrderError(problem('order.unknown', 'Algo salió mal'), 'La Casona')).toBe(
      'Algo salió mal',
    );
    expect(describeOrderError(problem(undefined, 'No hay conexión'), 'La Casona')).toBe(
      'No hay conexión',
    );
  });

  it('knows when a product can no longer be ordered', () => {
    expect(isProductUnavailable(problem('order.product_unavailable'))).toBe(true);
    expect(isProductUnavailable(problem('order.restaurant_unavailable'))).toBe(false);
  });
});
