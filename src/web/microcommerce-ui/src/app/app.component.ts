import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from './core/session.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly accountMenuOpen = signal(false);
  readonly session = this.sessionService.session;
  readonly isLoggedIn = this.sessionService.isLoggedIn;
  readonly roleLabel = this.sessionService.roleLabel;
  readonly toasts = this.toastService.toasts;
  readonly avatarInitials = computed(() => {
    const fullName = this.session()?.fullName?.trim();

    if (!fullName) {
      return 'G';
    }

    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  });
  readonly isAdmin = computed(() => this.session()?.role?.toLowerCase() === 'admin');
  readonly navItems = computed(() => {
    if (this.isAdmin()) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Reports', path: '/dashboard' },
        { label: 'Products', path: '/products' },
        { label: 'Categories', path: '/categories' },
        { label: 'Orders', path: '/orders' }
      ];
    }

    return [
      { label: 'Home', path: '/' },
      { label: 'Cart', path: '/cart' },
      { label: 'Orders', path: '/orders' }
    ];
  });

  handleSessionAction(): void {
    if (this.isLoggedIn()) {
      const fullName = this.session()?.fullName ?? 'User';
      this.sessionService.logout();
      this.accountMenuOpen.set(false);
      this.toastService.info(`${fullName} logged out successfully.`);
      void this.router.navigateByUrl('/login');
      return;
    }

    this.accountMenuOpen.set(false);
    void this.router.navigateByUrl('/login');
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((current) => !current);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.account-menu-wrap')) {
      this.closeAccountMenu();
    }
  }

  dismissToast(id: number): void {
    this.toastService.dismiss(id);
  }
}
