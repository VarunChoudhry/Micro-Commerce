import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { CartResponseVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);

  getCart(userId: string): Observable<CartResponseVm> {
    return this.http.get<CartResponseVm>(`${apiConfig.cartBaseUrl}/${userId}`);
  }

  addItem(userId: string, productId: number, productName: string, quantity: number, unitPrice: number): Observable<CartResponseVm> {
    return this.http.post<CartResponseVm>(`${apiConfig.cartBaseUrl}/items`, { userId, productId, productName, quantity, unitPrice });
  }

  updateItem(userId: string, productId: number, quantity: number): Observable<CartResponseVm> {
    return this.http.put<CartResponseVm>(`${apiConfig.cartBaseUrl}/items/${userId}/${productId}`, { userId, quantity });
  }

  removeItem(userId: string, productId: number): Observable<CartResponseVm> {
    return this.http.delete<CartResponseVm>(`${apiConfig.cartBaseUrl}/items/${userId}/${productId}`);
  }

  clear(userId: string): Observable<void> {
    return this.http.delete<void>(`${apiConfig.cartBaseUrl}/${userId}`);
  }
}
