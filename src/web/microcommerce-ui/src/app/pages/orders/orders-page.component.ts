import { CommonModule, CurrencyPipe, DatePipe, SlicePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AuthApiService } from '../../core/auth-api.service';
import { OrderApiService } from '../../core/order-api.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';
import { OrderResponseVm, UserProfileVm } from '../../core/store.models';

interface OrderRowVm extends OrderResponseVm {
  customerName: string;
}

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, SlicePipe, RouterLink],
  templateUrl: './orders-page.component.html'
})
export class OrdersPageComponent {
  private readonly orderApi = inject(OrderApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);

  orders: OrderRowVm[] = [];
  statusMessage = 'Loading orders...';
  pageTitle = 'Order History';
  customerName = 'Customer';
  readonly session = this.sessionService.session;
  readonly isAdmin = () => this.session()?.role?.toLowerCase() === 'admin';

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    const session = this.sessionService.session();
    if (!session) {
      this.statusMessage = 'Login to view your order history.';
      return;
    }

    this.customerName = session.fullName;
    this.pageTitle = this.isAdmin() ? 'All Orders' : `${session.fullName}'s Order History`;

    const orders$ = this.isAdmin() ? this.orderApi.getAllOrders() : this.orderApi.getOrders(session.userId);
    orders$.subscribe({
      next: (orders) => {
        const userIds = this.isAdmin() ? Array.from(new Set(orders.map((order) => order.userId))) : [session.userId];
        const profiles$ = userIds.length ? forkJoin(userIds.map((userId) => this.authApi.getProfile(userId))) : of([] as UserProfileVm[]);

        profiles$.subscribe({
          next: (profiles) => this.mapOrders(orders, userIds, profiles, session.fullName, this.isAdmin()),
          error: () => this.mapOrders(orders, userIds, [], session.fullName, this.isAdmin())
        });
      },
      error: () => {
        this.statusMessage = 'Could not load orders. Make sure OrderService is running.';
      }
    });
  }

  shipOrder(order: OrderRowVm): void {
    if (!this.isAdmin()) {
      return;
    }

    this.orderApi.updateOrderStatus(order.orderId, {
      status: 'Shipped',
      shippingCarrier: order.shippingCarrier || 'Standard Delivery',
      trackingNumber: order.trackingNumber
    }).subscribe({
      next: () => {
        this.toastService.success(`Order #${order.orderId.slice(-8)} moved to shipping.`);
        this.statusMessage = 'Order shipped.';
        this.loadOrders();
      },
      error: () => {
        this.toastService.error('Could not update order status.');
        this.statusMessage = 'Order shipping update failed.';
      }
    });
  }

  deliverOrder(order: OrderRowVm): void {
    if (!this.isAdmin()) {
      return;
    }

    this.orderApi.updateOrderStatus(order.orderId, {
      status: 'Delivered',
      shippingCarrier: order.shippingCarrier || 'Standard Delivery',
      trackingNumber: order.trackingNumber
    }).subscribe({
      next: () => {
        this.toastService.success(`Order #${order.orderId.slice(-8)} marked as delivered.`);
        this.statusMessage = 'Order delivered.';
        this.loadOrders();
      },
      error: () => {
        this.toastService.error('Could not update order status.');
        this.statusMessage = 'Order delivery update failed.';
      }
    });
  }

  canShip(order: OrderRowVm): boolean {
    const status = order.status.toLowerCase();
    return this.isAdmin() && (status === 'paid' || status === 'processing');
  }

  canDeliver(order: OrderRowVm): boolean {
    return this.isAdmin() && order.status.toLowerCase() === 'shipped';
  }

  getShippingSummary(order: OrderRowVm): string {
    const parts = [order.shippingCarrier, order.trackingNumber].filter((value) => !!value?.trim());
    if (order.status.toLowerCase() === 'delivered' && order.deliveredAt) {
      parts.push(`Delivered ${new Date(order.deliveredAt).toLocaleDateString('en-IN')}`);
    } else if (order.status.toLowerCase() === 'shipped' && order.shippedAt) {
      parts.push(`Shipped ${new Date(order.shippedAt).toLocaleDateString('en-IN')}`);
    }

    return parts.length ? parts.join(' • ') : 'Awaiting shipment';
  }

  describeItems(order: OrderRowVm): string {
    return order.items.length
      ? order.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')
      : 'No items';
  }

  private mapOrders(orders: OrderResponseVm[], userIds: string[], profiles: UserProfileVm[], fallbackName: string, isAdmin: boolean): void {
    const profileMap = new Map(userIds.map((userId, index) => [userId, profiles[index]?.fullName ?? `User ${userId.slice(0, 8)}`]));
    this.orders = orders.map((order) => ({
      ...order,
      customerName: profileMap.get(order.userId) ?? fallbackName
    }));
    this.statusMessage = this.orders.length === 0 ? 'No orders yet.' : 'Orders loaded.';
  }
}
