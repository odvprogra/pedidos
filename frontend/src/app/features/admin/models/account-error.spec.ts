import { describeAccountError } from './account-error';

describe('describeAccountError', () => {
  it.each([
    ['identity.admin_not_suspendable', 422, 'Las cuentas de administrador no se pueden suspender.'],
    ['identity.not_found', 404, 'No encontramos esa cuenta.'],
    ['access_denied', 403, 'Tu cuenta no tiene permiso para administrar cuentas.'],
    ['csrf_invalid', 403, 'No pudimos validar tu solicitud.'],
  ])('explains %s in Spanish', (code, status, message) => {
    expect(describeAccountError({ status, code, detail: 'Detalle del servidor' })).toContain(
      message,
    );
  });

  it.each([
    ['an unknown code', 'identity.something_else'],
    ['no code', undefined],
  ])('falls back to the detail of the server for %s', (_case, code) => {
    expect(describeAccountError({ status: 500, code, detail: 'Detalle del servidor' })).toBe(
      'Detalle del servidor',
    );
  });
});
