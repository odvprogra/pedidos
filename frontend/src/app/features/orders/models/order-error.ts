import { ProblemDetails } from '@core/http/problem-details';

const MESSAGES = new Map<string, string>([
  ['access_denied', 'Solo las cuentas de cliente tienen pedidos.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function isOrderMissing(problem: ProblemDetails): boolean {
  return (
    (problem.status === 404 && problem.code === 'order.not_found') ||
    (problem.status === 403 && problem.code === 'order.not_owner')
  );
}

export function isInvalidTransition(problem: ProblemDetails): boolean {
  return problem.status === 409 && problem.code === 'order.invalid_transition';
}

export function describeOrderError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
