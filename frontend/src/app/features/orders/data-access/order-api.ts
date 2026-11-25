import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Order } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/orders`;

  readonly eventsUrl = `${this.baseUrl}/events`;

  list(page: number, size: number): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(this.baseUrl, { params: { page, size } });
  }

  get(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  cancel(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/cancel`, null);
  }
}
