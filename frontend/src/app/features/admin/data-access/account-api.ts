import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { AccountAction } from '../models/account-action';
import { AccountSummary } from '../models/account-summary';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/accounts`;

  list(page: number, size: number): Observable<Page<AccountSummary>> {
    return this.http.get<Page<AccountSummary>>(this.baseUrl, { params: { page, size } });
  }

  apply(action: AccountAction, id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/${action}`, null);
  }
}
