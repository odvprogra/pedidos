import { ProblemDetails } from '@core/http/problem-details';

const MESSAGES = new Map<string, string>([
  [
    'restaurant.not_found',
    'No encontramos ese restaurante. Recarga la página para ver la lista al día.',
  ],
  ['access_denied', 'Tu cuenta no tiene permiso para administrar restaurantes.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function describeRestaurantError(problem: ProblemDetails): string {
  return MESSAGES.get(problem.code ?? '') ?? problem.detail;
}
