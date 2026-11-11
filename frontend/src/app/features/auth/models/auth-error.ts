import { FieldViolation, ProblemDetails } from '@core/http/problem-details';

export interface AuthErrorView {
  fieldErrors: FieldViolation[];
  alert: string | null;
}

const FIELD_ERRORS = new Map<string, FieldViolation>([
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
]);

const ALERTS = new Map<string, string>([
  [
    'identity.invalid_credentials',
    'El correo o la contraseña no coinciden. Revisa e intenta de nuevo.',
  ],
  [
    'identity.account_suspended',
    'Tu cuenta está suspendida. Habla con el administrador para reactivarla.',
  ],
  ['validation_failed', 'Revisa los datos marcados e intenta de nuevo.'],
  ['csrf_invalid', 'No pudimos validar tu solicitud. Intenta de nuevo.'],
]);

export function describeAuthError(problem: ProblemDetails): AuthErrorView {
  const code = problem.code ?? '';
  const backendErrors = problem.errors ?? [];
  const fieldError = FIELD_ERRORS.get(code);
  if (fieldError) {
    return { fieldErrors: [...backendErrors, fieldError], alert: null };
  }
  return { fieldErrors: backendErrors, alert: ALERTS.get(code) ?? problem.detail };
}
