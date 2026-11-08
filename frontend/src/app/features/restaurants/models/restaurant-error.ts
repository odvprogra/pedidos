import { ProblemDetails } from '@core/http/problem-details';

export function isRestaurantMissing(problem: ProblemDetails): boolean {
  return problem.status === 404 && problem.code === 'restaurant.not_found';
}
