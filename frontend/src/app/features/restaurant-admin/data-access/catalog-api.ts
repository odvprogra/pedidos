import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { Catalog, Category, Product, ProductDraft } from '../models/catalog';

@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/restaurants/mine`;

  mine(): Observable<Catalog> {
    return this.http.get<Catalog>(`${this.baseUrl}/catalog`);
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, { name });
  }

  renameCategory(categoryId: number, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${categoryId}`, { name });
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${categoryId}`);
  }

  createProduct(draft: ProductDraft): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, draft);
  }

  editProduct(productId: number, draft: ProductDraft): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${productId}`, draft);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${productId}`);
  }

  markSoldOut(productId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products/${productId}/mark-sold-out`, null);
  }

  markAvailable(productId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/products/${productId}/mark-available`, null);
  }
}
