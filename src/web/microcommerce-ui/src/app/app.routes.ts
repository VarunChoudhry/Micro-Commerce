import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SessionService } from './core/session.service';
import { AdminDashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { CartPageComponent } from './pages/cart/cart-page.component';
import { CategoriesPageComponent } from './pages/categories/categories-page.component';
import { HomePageComponent } from './pages/home/home-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { OrdersPageComponent } from './pages/orders/orders-page.component';
import { PaymentCancelPageComponent } from './pages/payment-cancel/payment-cancel-page.component';
import { PaymentSuccessPageComponent } from './pages/payment-success/payment-success-page.component';
import { ProductDetailPageComponent } from './pages/product-detail/product-detail-page.component';
import { ProductsPageComponent } from './pages/products/products-page.component';

const adminOnlyGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const role = sessionService.session()?.role?.toLowerCase();

  return role === 'admin' ? true : router.createUrlTree(['/']);
};

export const appRoutes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'dashboard', component: AdminDashboardPageComponent },
  { path: 'products', component: ProductsPageComponent, canActivate: [adminOnlyGuard] },
  { path: 'products/:id', component: ProductDetailPageComponent },
  { path: 'categories', component: CategoriesPageComponent },
  { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'cart', component: CartPageComponent },
  { path: 'orders', component: OrdersPageComponent },
  { path: 'payment/success', component: PaymentSuccessPageComponent },
  { path: 'payment/cancel', component: PaymentCancelPageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: '**', redirectTo: '' }
];
