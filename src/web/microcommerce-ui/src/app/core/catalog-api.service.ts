import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { CategoryVm, ProductVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);

  getProducts(categoryId?: number): Observable<ProductVm[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http.get<ProductVm[]>(`${apiConfig.catalogBaseUrl}/products`, { params });
  }

  searchProducts(query: string): Observable<ProductVm[]> {
    const params = new HttpParams().set('query', query.trim());
    return this.http.get<ProductVm[]>(`${apiConfig.catalogBaseUrl}/products/search`, { params });
  }

  getProductById(id: number): Observable<ProductVm> {
    return this.http.get<ProductVm>(`${apiConfig.catalogBaseUrl}/products/${id}`);
  }

  getCategories(): Observable<CategoryVm[]> {
    return this.http.get<CategoryVm[]>(`${apiConfig.catalogBaseUrl}/categories`);
  }

  createProduct(payload: { name: string; description: string; price: number; stock: number; categoryId: number; imageBase64?: string }): Observable<ProductVm> {
    return this.http.post<ProductVm>(`${apiConfig.catalogBaseUrl}/products`, payload);
  }

  updateProduct(id: number, payload: { name: string; description: string; price: number; stock: number; categoryId: number; imageBase64?: string }): Observable<ProductVm> {
    return this.http.put<ProductVm>(`${apiConfig.catalogBaseUrl}/products/${id}`, payload);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${apiConfig.catalogBaseUrl}/products/${id}`);
  }

  createCategory(name: string): Observable<CategoryVm> {
    return this.http.post<CategoryVm>(`${apiConfig.catalogBaseUrl}/categories`, { name });
  }

  updateCategory(id: number, name: string): Observable<CategoryVm> {
    return this.http.put<CategoryVm>(`${apiConfig.catalogBaseUrl}/categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${apiConfig.catalogBaseUrl}/categories/${id}`);
  }
}
