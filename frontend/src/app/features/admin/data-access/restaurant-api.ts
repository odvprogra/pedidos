import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { ModerationAction } from '../models/moderation-action';
import { RestaurantSummary } from '../models/restaurant-summary';

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1`;

  list(page: number, size: number): Observable<Page<RestaurantSummary>> {
    return this.http.get<Page<RestaurantSummary>>(`${this.apiUrl}/admin/restaurants`, {
      params: { page, size },
    });
  }

  apply(action: ModerationAction, id: number): Observable<RestaurantSummary> {
    return this.http.post<RestaurantSummary>(`${this.apiUrl}/restaurants/${id}/${action}`, null);
  }
}
