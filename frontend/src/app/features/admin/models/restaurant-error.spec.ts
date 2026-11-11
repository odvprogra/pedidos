import { describeRestaurantError } from './restaurant-error';

describe('describeRestaurantError', () => {
  it.each([
    ['restaurant.not_found', 404, 'No encontramos ese restaurante.'],
    ['access_denied', 403, 'Tu cuenta no tiene permiso para administrar restaurantes.'],
    ['csrf_invalid', 403, 'No pudimos validar tu solicitud.'],
  ])('explains %s in Spanish', (code, status, message) => {
    expect(describeRestaurantError({ status, code, detail: 'Detalle del servidor' })).toContain(
      message,
    );
  });

  it.each([
    ['an unknown code', 'restaurant.something_else'],
    ['no code', undefined],
  ])('falls back to the detail of the server for %s', (_case, code) => {
    expect(describeRestaurantError({ status: 500, code, detail: 'Detalle del servidor' })).toBe(
      'Detalle del servidor',
    );
  });
});
