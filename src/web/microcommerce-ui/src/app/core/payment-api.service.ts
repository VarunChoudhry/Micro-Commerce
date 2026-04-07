import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { CreateStripeCheckoutSessionVm, PaymentResponseVm, StripeCheckoutSessionVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);

  processPayment(payload: { orderId: string; userId: string; amount: number; method: string }): Observable<PaymentResponseVm> {
    return this.http.post<PaymentResponseVm>(`${apiConfig.paymentBaseUrl}/process`, payload);
  }

  createStripeCheckoutSession(payload: CreateStripeCheckoutSessionVm): Observable<StripeCheckoutSessionVm> {
    return this.http.post<StripeCheckoutSessionVm>(`${apiConfig.paymentBaseUrl}/stripe/session`, payload);
  }

  confirmStripeCheckoutSession(sessionId: string): Observable<PaymentResponseVm> {
    return this.http.post<PaymentResponseVm>(`${apiConfig.paymentBaseUrl}/stripe/confirm`, { sessionId });
  }

  getPaymentsByOrder(orderId: string): Observable<PaymentResponseVm[]> {
    return this.http.get<PaymentResponseVm[]>(`${apiConfig.paymentBaseUrl}/order/${orderId}`);
  }

  getAllPayments(): Observable<PaymentResponseVm[]> {
    return this.http.get<PaymentResponseVm[]>(apiConfig.paymentBaseUrl);
  }
}
