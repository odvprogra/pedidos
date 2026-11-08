import { ProblemDetails } from '@core/http/problem-details';

const NOT_REGISTERED = 'restaurant.not_found';
const ALREADY_REGISTERED = 'restaurant.already_registered';
const SUSPENDED = 'restaurant.suspended';

const MESSAGES = new Map<string, string>([
  [ALREADY_REGISTERED, 'Ya registraste un restaurante con esta cuenta.'],
  [
    SUSPENDED,
    'Tu restaurante está suspendido, así que no puedes abrirlo. Habla con el administrador para reactivarlo.',
  ],
  [NOT_REGISTERED, 'No encontramos tu restaurante. Recarga la página para ver tus datos al día.'],
  ['validation_failed', 'Revisa los datos marcados e intenta de nuevo.'],
  ['access_denied', 'Tu cuenta no tiene permiso para administrar un restaurante.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function isNotRegistered(problem: ProblemDetails): boolean {
  return problem.status === 404 && problem.code === NOT_REGISTERED;
}

export function isAlreadyRegistered(problem: ProblemDetails): boolean {
  return problem.code === ALREADY_REGISTERED;
}

export function isSuspended(problem: ProblemDetails): boolean {
  return problem.code === SUSPENDED;
}

export function describeRestaurantError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
