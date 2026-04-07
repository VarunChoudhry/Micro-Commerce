import { Injectable } from '@angular/core';
import { CartItemVm, OrderVm, ProductVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class MockStoreService {
  readonly categories = ['Electronics', 'Fashion', 'Books', 'Home'];

  readonly products: ProductVm[] = [
    {
      id: 1,
      name: 'Mechanical Keyboard',
      category: 'Electronics',
      price: 3499,
      stock: 25,
      rating: 4.7,
      description: 'Hot-swappable compact keyboard with RGB backlight and fast actuation.'
    },
    {
      id: 2,
      name: 'Noise Cancelling Headphones',
      category: 'Electronics',
      price: 7999,
      stock: 12,
      rating: 4.8,
      description: 'Wireless over-ear headphones built for long sessions and travel.'
    },
    {
      id: 3,
      name: 'Everyday Hoodie',
      category: 'Fashion',
      price: 1499,
      stock: 40,
      rating: 4.4,
      description: 'Soft fleece hoodie designed for all-day comfort.'
    },
    {
      id: 4,
      name: 'Desk Lamp Pro',
      category: 'Home',
      price: 2199,
      stock: 16,
      rating: 4.5,
      description: 'Minimal desk lamp with touch controls and warm-cool light modes.'
    }
  ];

  readonly cartItems: CartItemVm[] = [
    { productId: 1, product: 'Mechanical Keyboard', quantity: 1, price: 3499 },
    { productId: 3, product: 'Everyday Hoodie', quantity: 2, price: 1499 }
  ];

  readonly orders: OrderVm[] = [
    { id: 'ORD-1001', placedOn: new Date('2026-03-20'), total: 6497, status: 'Paid' },
    { id: 'ORD-1002', placedOn: new Date('2026-03-23'), total: 7999, status: 'Shipped' }
  ];

  addToCart(product: ProductVm): void {
    const existing = this.cartItems.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity += 1;
      return;
    }

    this.cartItems.push({
      productId: product.id,
      product: product.name,
      quantity: 1,
      price: product.price
    });
  }

  increaseCartItem(productName: string): void {
    const item = this.cartItems.find((entry) => entry.product === productName);
    if (item) {
      item.quantity += 1;
    }
  }

  decreaseCartItem(productName: string): void {
    const item = this.cartItems.find((entry) => entry.product === productName);
    if (!item) {
      return;
    }

    item.quantity -= 1;
    if (item.quantity <= 0) {
      this.removeCartItem(productName);
    }
  }

  removeCartItem(productName: string): void {
    const index = this.cartItems.findIndex((entry) => entry.product === productName);
    if (index >= 0) {
      this.cartItems.splice(index, 1);
    }
  }
}
