import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Catalog } from '../models/catalog';
import { Restaurant } from '../models/restaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants`;

  list(page: number, size: number): Observable<Page<Restaurant>> {
    return this.http.get<Page<Restaurant>>(this.baseUrl, { params: { page, size } });
  }

  get(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/${id}`);
  }

  catalog(id: number): Observable<Catalog> {
    return this.http.get<Catalog>(`${this.baseUrl}/${id}/catalog`);
  }
}
