import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { OrderStatus } from '@shared/utils/order-status';
import { Observable } from 'rxjs';
import { Order, OrderAction } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants/mine/orders`;

  readonly eventsUrl = `${this.baseUrl}/events`;

  list(statuses: OrderStatus[], page: number, size: number): Observable<Page<Order>> {
    return this.http.get<Page<Order>>(this.baseUrl, { params: { status: statuses, page, size } });
  }

  apply(action: OrderAction, id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/${id}/${action}`, null);
  }
}
