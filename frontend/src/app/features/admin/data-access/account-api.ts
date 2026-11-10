import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { AccountSummary } from '../models/account-summary';
import { ModerationAction } from '../models/moderation-action';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/accounts`;

  list(page: number, size: number): Observable<Page<AccountSummary>> {
    return this.http.get<Page<AccountSummary>>(this.baseUrl, { params: { page, size } });
  }

  apply(action: ModerationAction, id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/${action}`, null);
  }
}
