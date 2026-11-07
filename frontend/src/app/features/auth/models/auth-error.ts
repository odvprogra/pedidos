import { FormGroup } from '@angular/forms';
import { ProblemDetails } from '@core/http/problem-details';

export type AuthErrorField = 'email' | 'password';

export interface AuthError {
  field: AuthErrorField | null;
  message: string;
}

const AUTH_ERRORS = new Map<string, AuthError>([
  [
    'identity.invalid_credentials',
    { field: null, message: 'El correo o la contraseña no coinciden. Revisa e intenta de nuevo.' },
  ],
  [
    'identity.account_suspended',
    {
      field: null,
      message: 'Tu cuenta está suspendida. Habla con el administrador para reactivarla.',
    },
  ],
  [
    'identity.email_taken',
    { field: 'email', message: 'Ya hay una cuenta con este correo. Prueba ingresar con él.' },
  ],
  [
    'identity.invalid_email',
    { field: 'email', message: 'Ingresa un correo válido, como ana@correo.com.' },
  ],
  ['identity.password_too_short', { field: 'password', message: 'Usa al menos 8 caracteres.' }],
  [
    'identity.password_too_long',
    { field: 'password', message: 'Tu contraseña es demasiado larga. Prueba con una más corta.' },
  ],
  ['validation_failed', { field: null, message: 'Revisa los datos marcados e intenta de nuevo.' }],
  ['unauthenticated', { field: null, message: 'Tu sesión terminó. Ingresa de nuevo.' }],
  ['csrf_invalid', { field: null, message: 'No pudimos validar tu solicitud. Intenta de nuevo.' }],
]);

export function describeAuthError(problem: ProblemDetails): AuthError {
  return AUTH_ERRORS.get(problem.code ?? '') ?? { field: null, message: problem.detail };
}

export function applyAuthError(form: FormGroup, problem: ProblemDetails): string | null {
  for (const { field, message } of problem.errors ?? []) {
    form.get(field)?.setErrors({ server: message });
  }
  const error = describeAuthError(problem);
  const control = error.field ? form.get(error.field) : null;
  if (!control) {
    return error.message;
  }
  control.setErrors({ server: error.message });
  return null;
}
