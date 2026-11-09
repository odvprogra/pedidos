import { ProblemDetails } from '@core/http/problem-details';

const MESSAGES = new Map<string, string>([
  ['order.not_found', 'Ese pedido ya no existe.'],
  ['order.not_owner', 'Ese pedido es de otro restaurante.'],
  ['access_denied', 'Solo el dueño del restaurante atiende sus pedidos.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function isOrderChanged(problem: ProblemDetails): boolean {
  return problem.status === 409 && problem.code === 'order.invalid_transition';
}

export function describeOrderError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
