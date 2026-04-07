import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-cancel-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-cancel-page.component.html'
})
export class PaymentCancelPageComponent {
  readonly statusMessage = 'Payment was cancelled or not completed. Your order remains pending until payment is finished.';
}
