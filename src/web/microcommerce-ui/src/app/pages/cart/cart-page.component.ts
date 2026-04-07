import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, switchMap, throwError } from 'rxjs';
import { CartApiService } from '../../core/cart-api.service';
import { CatalogApiService } from '../../core/catalog-api.service';
import { InventoryApiService } from '../../core/inventory-api.service';
import { OrderApiService } from '../../core/order-api.service';
import { PaymentApiService } from '../../core/payment-api.service';
import { toProductImageSource } from '../../core/product-image.util';
import { CartItemVm } from '../../core/store.models';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './cart-page.component.html'
})
export class CartPageComponent {
  private readonly cartApi = inject(CartApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly orderApi = inject(OrderApiService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);

  cartItems: CartItemVm[] = [];
  shippingAddress = '';
  statusMessage = 'Loading cart...';

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalAmount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  }

  constructor() {
    this.loadCart();
  }

  loadCart(): void {
    const session = this.sessionService.session();
    if (!session) {
      this.statusMessage = 'Please login to access your cart.';
      this.cartItems = [];
      return;
    }

    this.shippingAddress ||= `${session.fullName}, Demo Address, Angular Street, India`;

    forkJoin({
      cart: this.cartApi.getCart(session.userId),
      products: this.catalogApi.getProducts()
    }).subscribe({
      next: ({ cart, products }) => {
        const productsById = new Map(products.map((product) => [product.id, product]));
        this.cartItems = cart.items.map((item) => ({
          productId: item.productId,
          product: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
          imageBase64: productsById.get(item.productId)?.imageBase64
        }));
        this.statusMessage = this.cartItems.length === 0 ? 'Your cart is empty.' : 'Cart loaded.';
      },
      error: () => {
        this.statusMessage = 'Could not load cart. Make sure CartService and CatalogService are running.';
      }
    });
  }

  getProductImage(item: CartItemVm): string {
    return toProductImageSource(item.imageBase64);
  }

  increase(item: CartItemVm): void {
    const session = this.sessionService.session();
    if (!session) return;
    this.cartApi.updateItem(session.userId, item.productId, item.quantity + 1).subscribe({ next: () => this.loadCart() });
  }

  decrease(item: CartItemVm): void {
    const session = this.sessionService.session();
    if (!session) return;
    const nextQuantity = item.quantity - 1;
    if (nextQuantity <= 0) {
      this.remove(item);
      return;
    }
    this.cartApi.updateItem(session.userId, item.productId, nextQuantity).subscribe({ next: () => this.loadCart() });
  }

  remove(item: CartItemVm): void {
    const session = this.sessionService.session();
    if (!session) return;
    this.cartApi.removeItem(session.userId, item.productId).subscribe({ next: () => this.loadCart() });
  }

  checkout(): void {
    const session = this.sessionService.session();
    if (!session || this.cartItems.length === 0) {
      this.statusMessage = 'Add items and sign in before checkout.';
      return;
    }

    const shippingAddress = this.shippingAddress.trim();
    if (!shippingAddress) {
      this.statusMessage = 'Please enter a shipping address before checkout.';
      this.toastService.error('Shipping address is required.');
      return;
    }

    this.inventoryApi.getInventory().pipe(
      switchMap((inventory) => {
        const inventoryMap = new Map(inventory.map((item) => [item.productId, item.availableStock]));
        const shortage = this.cartItems.find((item) => (inventoryMap.get(item.productId) ?? 0) < item.quantity);

        if (shortage) {
          const available = inventoryMap.get(shortage.productId) ?? 0;
          const message = `${shortage.product} only has ${available} left in stock.`;
          this.statusMessage = message;
          this.toastService.error(message);
          return throwError(() => ({ kind: 'stock', message }));
        }

        const reserveRequests = this.cartItems.map((item) =>
          this.inventoryApi.reserve(item.productId, item.quantity)
        );

        return forkJoin(reserveRequests.length ? reserveRequests : [of(null)]).pipe(
          switchMap(() => this.orderApi.createOrder({
            userId: session.userId,
            shippingAddress,
            items: this.cartItems.map((item) => ({
              productId: item.productId,
              productName: item.product,
              quantity: item.quantity,
              unitPrice: item.price
            }))
          }))
        );
      })
    ).subscribe({
      next: (order) => {
        const origin = window.location.origin;
        this.toastService.info('Order created. Starting Stripe checkout...');
        this.paymentApi.createStripeCheckoutSession({
          orderId: order.orderId,
          userId: session.userId,
          amount: order.totalAmount,
          currency: 'inr',
          successUrl: `${origin}/payment/success`,
          cancelUrl: `${origin}/payment/cancel`,
          items: this.cartItems.map((item) => ({
            name: item.product,
            description: `Qty ${item.quantity}`,
            unitPrice: item.price,
            quantity: item.quantity
          }))
        }).subscribe({
          next: (checkoutSession) => {
            this.cartApi.clear(session.userId).subscribe({
              next: () => window.location.assign(checkoutSession.url),
              error: () => window.location.assign(checkoutSession.url)
            });
          },
          error: () => {
            this.statusMessage = 'Could not start Stripe checkout. Please try again.';
            this.toastService.error('Could not start Stripe checkout.');
          }
        });
      },
      error: (error) => {
        if (error?.kind === 'stock') {
          this.statusMessage = error.message;
          return;
        }

        this.statusMessage = 'Checkout could not be completed right now. Please try again.';
        this.toastService.error('Checkout could not be completed right now.');
      }
    });
  }
}

