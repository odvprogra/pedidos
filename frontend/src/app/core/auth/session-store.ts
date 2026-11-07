import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Account } from './account';
import { SessionApi } from './session-api';

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

type SessionState =
  { status: 'loading' } | { status: 'anonymous' } | { status: 'authenticated'; account: Account };

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionApi = inject(SessionApi);
  private readonly state = signal<SessionState>({ status: 'loading' });

  readonly status = computed<SessionStatus>(() => this.state().status);
  readonly account = computed(() => {
    const state = this.state();
    return state.status === 'authenticated' ? state.account : null;
  });

  load(): Observable<void> {
    return this.sessionApi.me().pipe(
      tap((account) => this.signIn(account)),
      map(() => undefined),
      catchError(() => {
        this.clear();
        return of(undefined);
      }),
    );
  }

  signIn(account: Account): void {
    this.state.set({ status: 'authenticated', account });
  }

  clear(): void {
    this.state.set({ status: 'anonymous' });
  }

  logOut(): Observable<void> {
    return this.sessionApi.logOut().pipe(
      catchError((error: unknown) =>
        isUnauthorized(error) ? of(undefined) : throwError(() => error),
      ),
      tap(() => this.clear()),
    );
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}
