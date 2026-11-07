import { FormControl, FormGroup } from '@angular/forms';
import { ProblemDetails } from '@core/http/problem-details';
import { applyAuthError, describeAuthError } from './auth-error';

function problem(code: string | undefined, status = 400): ProblemDetails {
  return { status, detail: 'Detalle del servidor', code };
}

describe('describeAuthError', () => {
  it.each([
    ['identity.invalid_credentials', null, 'El correo o la contraseña no coinciden'],
    ['identity.account_suspended', null, 'Tu cuenta está suspendida'],
    ['identity.email_taken', 'email', 'Ya hay una cuenta con este correo'],
    ['identity.invalid_email', 'email', 'Ingresa un correo válido'],
    ['identity.password_too_short', 'password', 'Usa al menos 8 caracteres'],
    ['identity.password_too_long', 'password', 'Tu contraseña es demasiado larga'],
    ['validation_failed', null, 'Revisa los datos marcados'],
    ['unauthenticated', null, 'Tu sesión terminó'],
    ['csrf_invalid', null, 'No pudimos validar tu solicitud'],
  ])('explains %s in spanish', (code, field, message) => {
    const error = describeAuthError(problem(code));

    expect(error.field).toBe(field);
    expect(error.message).toContain(message);
  });

  it.each([
    ['an unknown code', 'identity.something_new'],
    ['a missing code', undefined],
  ])('falls back to the detail of the problem for %s', (_case, code) => {
    expect(describeAuthError(problem(code))).toEqual({
      field: null,
      message: 'Detalle del servidor',
    });
  });
});

describe('applyAuthError', () => {
  function form(): FormGroup {
    return new FormGroup({
      name: new FormControl('Ana'),
      email: new FormControl('ana@correo.com'),
      password: new FormControl('secreta123'),
    });
  }

  it('puts a field error under its field and leaves no alert', () => {
    const group = form();

    const alert = applyAuthError(group, problem('identity.email_taken', 409));

    expect(alert).toBeNull();
    expect(group.get('email')?.errors).toEqual({ server: expect.stringContaining('Ya hay') });
  });

  it('returns the alert for an error that belongs to the whole form', () => {
    const group = form();

    const alert = applyAuthError(group, problem('identity.invalid_credentials', 401));

    expect(alert).toContain('no coinciden');
    expect(group.valid).toBe(true);
  });

  it('marks every field rejected by the backend validation', () => {
    const group = form();

    const alert = applyAuthError(group, {
      ...problem('validation_failed'),
      errors: [{ field: 'name', message: 'no debe estar vacío' }],
    });

    expect(alert).toContain('Revisa los datos marcados');
    expect(group.get('name')?.errors).toEqual({ server: 'no debe estar vacío' });
  });
});
