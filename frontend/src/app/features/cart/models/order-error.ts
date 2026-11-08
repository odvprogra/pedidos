import { ProblemDetails } from '@core/http/problem-details';

const RESTAURANT_UNAVAILABLE = 'order.restaurant_unavailable';
const PRODUCT_UNAVAILABLE = 'order.product_unavailable';

const MESSAGES = new Map<string, string>([
  ['order.empty', 'Tu carrito está vacío. Agrega productos antes de confirmar.'],
  ['order.invalid_quantity', 'Cada producto puede ir de 1 a 99 unidades. Revisa las cantidades.'],
  [
    'order.duplicate_product',
    'Un producto aparece dos veces en tu carrito. Quita uno y vuelve a intentar.',
  ],
  [
    PRODUCT_UNAVAILABLE,
    'Un producto de tu carrito se agotó o ya no está en el menú. Revisa el menú y vuelve a intentar.',
  ],
  ['access_denied', 'Solo las cuentas de cliente pueden hacer pedidos.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
  ['validation_failed', 'No pudimos leer tu carrito. Vacíalo y vuelve a armarlo.'],
]);

export function isProductUnavailable(problem: ProblemDetails): boolean {
  return problem.code === PRODUCT_UNAVAILABLE;
}

export function describeOrderError(problem: ProblemDetails, restaurantName: string): string {
  if (problem.code === RESTAURANT_UNAVAILABLE) {
    return `${restaurantName} no está recibiendo pedidos ahora. Tu carrito queda guardado para cuando abra.`;
  }
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
