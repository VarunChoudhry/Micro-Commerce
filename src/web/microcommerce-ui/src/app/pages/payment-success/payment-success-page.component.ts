import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentApiService } from '../../core/payment-api.service';
import { PaymentResponseVm } from '../../core/store.models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-payment-success-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './payment-success-page.component.html'
})
export class PaymentSuccessPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  statusMessage = 'Confirming your payment...';
  payment: PaymentResponseVm | null = null;
  autoRedirectMessage = 'You will be redirected to your orders shortly.';

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      this.statusMessage = 'Stripe session id is missing from the return URL.';
      return;
    }

    this.paymentApi.confirmStripeCheckoutSession(sessionId).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.statusMessage = 'Payment confirmed successfully.';
        this.toastService.success('Payment confirmed successfully.');
        setTimeout(() => void this.router.navigateByUrl('/orders'), 1800);
      },
      error: () => {
        this.statusMessage = 'Payment confirmation failed. If your Stripe payment completed, refresh after a moment.';
        this.toastService.error('Payment confirmation failed.');
      }
    });
  }
}
