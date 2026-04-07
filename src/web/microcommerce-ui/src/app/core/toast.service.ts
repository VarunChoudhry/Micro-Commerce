import { Injectable, computed, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastVm {
  id: number;
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly toastState = signal<ToastVm[]>([]);

  readonly toasts = this.toastState.asReadonly();
  readonly hasToasts = computed(() => this.toastState().length > 0);

  success(message: string, title = 'Success'): void {
    this.push({ title, message, type: 'success' });
  }

  error(message: string, title = 'Error'): void {
    this.push({ title, message, type: 'error' });
  }

  info(message: string, title = 'Info'): void {
    this.push({ title, message, type: 'info' });
  }

  warning(message: string, title = 'Warning'): void {
    this.push({ title, message, type: 'warning' });
  }

  dismiss(id: number): void {
    this.toastState.update((items) => items.filter((toast) => toast.id !== id));
  }

  private push(toast: Omit<ToastVm, 'id'>): void {
    const id = this.nextId++;
    this.toastState.update((items) => [...items, { id, ...toast }]);
    window.setTimeout(() => this.dismiss(id), 3200);
  }
}
