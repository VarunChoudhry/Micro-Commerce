import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { OrderResponseVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly http = inject(HttpClient);

  getOrders(userId: string): Observable<OrderResponseVm[]> {
    return this.http.get<OrderResponseVm[]>(`${apiConfig.orderBaseUrl}/user/${userId}`);
  }

  getAllOrders(): Observable<OrderResponseVm[]> {
    return this.http.get<OrderResponseVm[]>(apiConfig.orderBaseUrl);
  }

  createOrder(payload: { userId: string; shippingAddress: string; items: Array<{ productId: number; productName: string; quantity: number; unitPrice: number }> }): Observable<OrderResponseVm> {
    return this.http.post<OrderResponseVm>(apiConfig.orderBaseUrl, payload);
  }

  updateOrderStatus(orderId: string, payload: { status: string; shippingCarrier?: string; trackingNumber?: string }): Observable<OrderResponseVm> {
    return this.http.put<OrderResponseVm>(`${apiConfig.orderBaseUrl}/${orderId}/status`, payload);
  }
}
