import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LOG_IN_PATH } from './return-url';
import { AUTH_URL } from './session-api';
import { SessionStore } from './session-store';

export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isUnauthorized(error) && !request.url.startsWith(`${AUTH_URL}/`)) {
        const hadSession = session.account() !== null;
        session.clear();
        router.navigate([LOG_IN_PATH], {
          queryParams: { returnUrl: router.url, sessionExpired: hadSession || null },
        });
      }
      return throwError(() => error);
    }),
  );
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
