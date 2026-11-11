import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LOG_IN_PATH } from './auth-paths';
import { AUTH_URL } from './session-api';
import { SessionStore } from './session-store';

export const unauthorizedInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isUnauthorized(error) && !request.url.startsWith(`${AUTH_URL}/`)) {
        sendToLogIn(session, router);
      }
      return throwError(() => error);
    }),
  );
};

function sendToLogIn(session: SessionStore, router: Router): void {
  const currentUrl = router.currentNavigation()?.extractedUrl.toString() ?? router.url;
  if (currentUrl.startsWith(LOG_IN_PATH)) {
    return;
  }
  const hadSession = session.account() !== null;
  session.clear();
  router.navigate([LOG_IN_PATH], {
    queryParams: { returnUrl: currentUrl, sessionExpired: hadSession || null },
  });
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
