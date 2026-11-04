import { HttpErrorResponse } from '@angular/common/http';
import { toProblemDetails } from './problem-details';

describe('toProblemDetails', () => {
  it('returns the problem sent by the backend', () => {
    const body = { status: 404, detail: 'No existe', code: 'restaurant.not_found' };

    const problem = toProblemDetails(new HttpErrorResponse({ status: 404, error: body }));

    expect(problem).toEqual(body);
  });

  it('explains that the server is unreachable when there is no response', () => {
    const problem = toProblemDetails(new HttpErrorResponse({ status: 0 }));

    expect(problem.detail).toContain('No hay conexión');
  });

  it('falls back to a generic message for unexpected errors', () => {
    const problem = toProblemDetails(new Error('boom'));

    expect(problem).toEqual({ status: 0, detail: expect.stringContaining('No pudimos') });
  });
});
