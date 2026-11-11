import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Restaurant, RestaurantRegistration } from '../models/restaurant';

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants`;

  mine(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.baseUrl}/mine`);
  }

  register(registration: RestaurantRegistration): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.baseUrl, registration);
  }

  open(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mine/open`, null);
  }

  close(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/mine/close`, null);
  }
}
