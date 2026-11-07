import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Role } from './account';
import { LOG_IN_PATH } from './return-url';
import { SessionStore } from './session-store';

export const authGuard: CanActivateFn = (_route, state) =>
  inject(SessionStore).account() ? true : logInRedirect(state.url);

export function roleGuard(...roles: Role[]): CanActivateFn {
  return (_route, state) => {
    const account = inject(SessionStore).account();
    if (!account) {
      return logInRedirect(state.url);
    }
    return roles.includes(account.role) || inject(Router).createUrlTree(['/']);
  };
}

export const guestGuard: CanActivateFn = () =>
  inject(SessionStore).account() ? inject(Router).createUrlTree(['/']) : true;

function logInRedirect(returnUrl: string): UrlTree {
  return inject(Router).createUrlTree([LOG_IN_PATH], { queryParams: { returnUrl } });
}
