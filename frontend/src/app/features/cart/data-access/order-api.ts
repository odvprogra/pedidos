import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Order, OrderRequest } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/orders`;

  place(request: OrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, request);
  }
}
