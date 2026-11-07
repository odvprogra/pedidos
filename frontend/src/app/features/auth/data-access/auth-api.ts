import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Account } from '@core/auth/account';
import { AUTH_URL } from '@core/auth/session-api';
import { Observable } from 'rxjs';
import { Credentials, Registration } from '../models/credentials';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  logIn(credentials: Credentials): Observable<Account> {
    return this.http.post<Account>(`${AUTH_URL}/login`, credentials);
  }

  register(registration: Registration): Observable<Account> {
    return this.http.post<Account>(`${AUTH_URL}/register`, registration);
  }
}
