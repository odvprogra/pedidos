import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Page } from '@core/http/page';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { PlatformOrder } from '../models/platform-order';

@Injectable({ providedIn: 'root' })
export class PlatformOrderApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/admin/orders`;

  list(page: number, size: number): Observable<Page<PlatformOrder>> {
    return this.http.get<Page<PlatformOrder>>(this.baseUrl, { params: { page, size } });
  }
}
