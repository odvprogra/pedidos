import { HttpErrorResponse } from '@angular/common/http';
import { toProblemDetails } from './problem-details';

describe('toProblemDetails', () => {
  it('returns the problem sent by the backend', () => {
    const body = { status: 404, detail: 'No existe', code: 'restaurant.not_found' };

    const problem = toProblemDetails(new HttpErrorResponse({ status: 404, error: body }));

    expect(problem).toEqual(body);
  });

  it('explains in plain words that there is no connection when there is no response', () => {
    const problem = toProblemDetails(new HttpErrorResponse({ status: 0 }));

    expect(problem).toEqual({
      status: 0,
      detail: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
    });
  });

  it('falls back to a plain message when the answer is not a problem', () => {
    const problem = toProblemDetails(
      new HttpErrorResponse({ status: 502, error: '<html>Bad Gateway</html>' }),
    );

    expect(problem).toEqual({
      status: 502,
      detail: 'Algo salió mal de nuestro lado. Intenta de nuevo en un momento.',
    });
  });

  it('falls back to the same message for errors that are not from HTTP', () => {
    const problem = toProblemDetails(new Error('boom'));

    expect(problem).toEqual({
      status: 0,
      detail: 'Algo salió mal de nuestro lado. Intenta de nuevo en un momento.',
    });
  });
});
