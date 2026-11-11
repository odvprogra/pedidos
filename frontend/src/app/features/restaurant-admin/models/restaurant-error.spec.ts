import {
  describeRestaurantError,
  isAlreadyRegistered,
  isNotRegistered,
  isSuspended,
} from './restaurant-error';

describe('isNotRegistered', () => {
  it('recognizes an owner without a restaurant', () => {
    expect(
      isNotRegistered({ status: 404, code: 'restaurant.not_found', detail: 'Sin restaurante' }),
    ).toBe(true);
  });

  it.each([
    ['another not found', { status: 404, code: 'identity.not_found', detail: 'x' }],
    ['a not found without code', { status: 404, detail: 'x' }],
    ['a server error', { status: 500, detail: 'x' }],
    ['no connection', { status: 0, detail: 'x' }],
  ])('does not treat %s as a missing restaurant', (_case, problem) => {
    expect(isNotRegistered(problem)).toBe(false);
  });
});

describe('the conflicts of the page', () => {
  it('recognizes a second registration', () => {
    expect(
      isAlreadyRegistered({ status: 409, code: 'restaurant.already_registered', detail: 'x' }),
    ).toBe(true);
    expect(isAlreadyRegistered({ status: 409, code: 'restaurant.suspended', detail: 'x' })).toBe(
      false,
    );
  });

  it('recognizes a suspended restaurant', () => {
    expect(isSuspended({ status: 409, code: 'restaurant.suspended', detail: 'x' })).toBe(true);
    expect(isSuspended({ status: 409, code: 'restaurant.already_registered', detail: 'x' })).toBe(
      false,
    );
  });
});

describe('describeRestaurantError', () => {
  it.each([
    ['restaurant.already_registered', 409, 'Ya registraste un restaurante'],
    ['restaurant.suspended', 409, 'No pudimos abrir tu restaurante: está suspendido.'],
    ['restaurant.not_found', 404, 'No encontramos tu restaurante'],
    ['validation_failed', 400, 'Revisa los datos marcados'],
    ['access_denied', 403, 'no tiene permiso para administrar un restaurante'],
    ['csrf_invalid', 403, 'No pudimos validar tu solicitud'],
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
