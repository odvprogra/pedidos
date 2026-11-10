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

const OFFLINE_DETAIL = 'No hay conexión. Revisa tu internet e intenta de nuevo.';
const FALLBACK_DETAIL = 'Algo salió mal de nuestro lado. Intenta de nuevo en un momento.';

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
