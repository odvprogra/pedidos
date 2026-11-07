import { ProblemDetails } from '@core/http/problem-details';

const MESSAGES = new Map<string, string>([
  ['identity.admin_not_suspendable', 'Las cuentas de administrador no se pueden suspender.'],
  ['identity.not_found', 'No encontramos esa cuenta. Actualiza la lista e intenta de nuevo.'],
  ['access_denied', 'Tu cuenta no tiene permiso para administrar cuentas.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function describeAccountError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
