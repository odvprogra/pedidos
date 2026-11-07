import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Account } from './account';

export const AUTH_URL = `${environment.apiUrl}/v1/auth`;

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);

  me(): Observable<Account> {
    return this.http.get<Account>(`${AUTH_URL}/me`);
  }

  logOut(): Observable<void> {
    return this.http.post<void>(`${AUTH_URL}/logout`, null);
  }
}
