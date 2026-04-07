import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { AuthApiService } from '../../core/auth-api.service';
import { OrderApiService } from '../../core/order-api.service';
import { PaymentApiService } from '../../core/payment-api.service';
import { OrderResponseVm, PaymentResponseVm, UserProfileVm } from '../../core/store.models';

interface SummaryCardVm {
  label: string;
  value: string;
  hint: string;
}

interface ChartBarVm {
  label: string;
  count: number;
  percent: number;
}

interface RecentOrderVm extends OrderResponseVm {
  customerName: string;
}

interface RecentPaymentVm extends PaymentResponseVm {
  customerName: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard-page.component.html'
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly authApi = inject(AuthApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly paymentApi = inject(PaymentApiService);

  statusMessage = 'Loading dashboard...';
  summaryCards: SummaryCardVm[] = [];
  orderBars: ChartBarVm[] = [];
  paymentBars: ChartBarVm[] = [];
  recentOrders: RecentOrderVm[] = [];
  recentPayments: RecentPaymentVm[] = [];

  ngOnInit(): void {
    forkJoin({
      orders: this.orderApi.getAllOrders(),
      payments: this.paymentApi.getAllPayments()
    }).subscribe({
      next: ({ orders, payments }) => {
        const userIds = Array.from(new Set([...orders, ...payments].map((item) => item.userId)));
        const profiles$ = userIds.length ? forkJoin(userIds.map((userId) => this.authApi.getProfile(userId))) : of([] as UserProfileVm[]);

        profiles$.subscribe({
          next: (profiles) => {
            const profileMap = new Map(userIds.map((userId, index) => [userId, profiles[index]?.fullName ?? `User ${userId.slice(0, 8)}`]));

            this.recentOrders = [...orders]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 5)
              .map((order) => ({ ...order, customerName: profileMap.get(order.userId) ?? `User ${order.userId.slice(0, 8)}` }));

            this.recentPayments = [...payments]
              .sort((a, b) => +new Date(b.processedAt) - +new Date(a.processedAt))
              .slice(0, 5)
              .map((payment) => ({ ...payment, customerName: profileMap.get(payment.userId) ?? `User ${payment.userId.slice(0, 8)}` }));

            this.buildSummary(orders, payments);
            this.statusMessage = 'Dashboard loaded.';
          },
          error: () => {
            this.recentOrders = [...orders]
              .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
              .slice(0, 5)
              .map((order) => ({ ...order, customerName: `User ${order.userId.slice(0, 8)}` }));
            this.recentPayments = [...payments]
              .sort((a, b) => +new Date(b.processedAt) - +new Date(a.processedAt))
              .slice(0, 5)
              .map((payment) => ({ ...payment, customerName: `User ${payment.userId.slice(0, 8)}` }));
            this.buildSummary(orders, payments);
            this.statusMessage = 'Dashboard loaded.';
          }
        });
      },
      error: () => {
        this.statusMessage = 'Could not load dashboard. Make sure OrderService and PaymentService are running.';
      }
    });
  }

  describeItems(order: OrderResponseVm): string {
    return order.items.length
      ? order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')
      : 'No items';
  }

  private buildSummary(orders: OrderResponseVm[], payments: PaymentResponseVm[]): void {
    const succeededPayments = payments.filter((payment) => payment.status.toLowerCase() === 'succeeded');
    const failedPayments = payments.filter((payment) => payment.status.toLowerCase() === 'failed');
    const uniquePaidOrderIds = new Set(succeededPayments.map((payment) => payment.orderId));
    const pendingPaymentCount = Math.max(orders.length - uniquePaidOrderIds.size, 0);
    const salesDone = succeededPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((order) => ['paid', 'processing', 'shipped', 'delivered'].includes(order.status.toLowerCase()));

    this.summaryCards = [
      { label: 'Sales Done', value: salesDone.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }), hint: `${succeededPayments.length} successful payments` },
      { label: 'Total Orders', value: totalOrders.toString(), hint: `${completedOrders.length} active or completed orders` },
      { label: 'Payments Done', value: succeededPayments.length.toString(), hint: `${failedPayments.length} failed payments` },
      { label: 'Pending Payments', value: pendingPaymentCount.toString(), hint: 'Orders waiting for payment' }
    ];

    this.orderBars = this.toBars(this.groupCounts(orders.map((order) => order.status), ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled']));
    this.paymentBars = this.toBars(this.groupCounts(payments.map((payment) => payment.status), ['Succeeded', 'Failed']));
  }

  private groupCounts(values: string[], labels: string[]): Array<{ label: string; count: number }> {
    return labels.map((label) => ({
      label,
      count: values.filter((value) => value.toLowerCase() === label.toLowerCase()).length
    }));
  }

  private toBars(items: Array<{ label: string; count: number }>): ChartBarVm[] {
    const max = Math.max(...items.map((item) => item.count), 1);
    return items.map((item) => ({
      ...item,
      percent: Math.round((item.count / max) * 100)
    }));
  }
}
