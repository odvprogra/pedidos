import { ProblemDetails } from '@core/http/problem-details';
import { describeAuthError } from './auth-error';

function problem(code: string | undefined, status = 400): ProblemDetails {
  return { status, detail: 'Detalle del servidor', code };
}

describe('describeAuthError', () => {
  it.each([
    ['identity.email_taken', 'email', 'Ya hay una cuenta con este correo'],
    ['identity.invalid_email', 'email', 'Ingresa un correo válido'],
    ['identity.password_too_short', 'password', 'Usa al menos 8 caracteres'],
    ['identity.password_too_long', 'password', 'Tu contraseña es demasiado larga'],
  ])('puts %s under the %s field', (code, field, message) => {
    const view = describeAuthError(problem(code));

    expect(view.alert).toBeNull();
    expect(view.fieldErrors).toEqual([{ field, message: expect.stringContaining(message) }]);
  });

  it.each([
    ['identity.invalid_credentials', 'El correo o la contraseña no coinciden'],
    ['identity.account_suspended', 'Tu cuenta está suspendida'],
    ['validation_failed', 'Revisa los datos marcados'],
    ['csrf_invalid', 'No pudimos validar tu solicitud'],
  ])('explains %s in an alert', (code, message) => {
    const view = describeAuthError(problem(code));

    expect(view.alert).toContain(message);
    expect(view.fieldErrors).toEqual([]);
  });

  it.each([
    ['an unknown code', 'identity.something_new'],
    ['a missing code', undefined],
  ])('falls back to the detail of the problem for %s', (_case, code) => {
    expect(describeAuthError(problem(code)).alert).toBe('Detalle del servidor');
  });

  it('keeps the fields rejected by the backend validation', () => {
    const view = describeAuthError({
      ...problem('validation_failed'),
      errors: [{ field: 'name', message: 'no debe estar vacío' }],
    });

    expect(view.fieldErrors).toEqual([{ field: 'name', message: 'no debe estar vacío' }]);
    expect(view.alert).toContain('Revisa los datos marcados');
  });
});
