import { HttpErrorResponse } from '@angular/common/http';

export interface FieldViolation {
  field: string;
  message: string;
}

export interface ProblemDetails {
  status: number;
  detail: string;
  code?: string;
  errors?: FieldViolation[];
}

const OFFLINE_DETAIL = 'No hay conexión con el servidor. Revisa tu conexión e intenta de nuevo.';
const FALLBACK_DETAIL = 'No pudimos completar la operación. Intenta de nuevo.';

export function toProblemDetails(error: unknown): ProblemDetails {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: 0, detail: FALLBACK_DETAIL };
  }
  if (isProblemDetails(error.error)) {
    return error.error;
  }
  return {
    status: error.status,
    detail: error.status === 0 ? OFFLINE_DETAIL : FALLBACK_DETAIL,
  };
}

function isProblemDetails(body: unknown): body is ProblemDetails {
  return typeof body === 'object' && body !== null && 'status' in body && 'detail' in body;
}
