import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthApiService } from '../../core/auth-api.service';
import { SessionService } from '../../core/session.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly sessionService = inject(SessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  email = 'user@microcommerce.local';
  password = 'User@123';
  fullName = 'New User';
  statusMessage = 'Use backend-backed login for user or admin.';

  login(): void {
    this.authApi.login(this.email, this.password).subscribe({
      next: (response) => {
        this.sessionService.setSession(response);
        this.statusMessage = `Welcome back, ${response.fullName}.`;
        this.toastService.success(`Welcome back, ${response.fullName}.`);
        void this.router.navigateByUrl(response.role === 'Admin' ? '/dashboard' : '/');
      },
      error: (error: HttpErrorResponse) => {
        this.statusMessage = error.status === 401 ? 'Invalid credentials.' : 'Login failed. Make sure AuthService is running.';
        this.toastService.error(error.status === 401 ? 'Invalid credentials.' : 'Login failed.');
      }
    });
  }

  register(): void {
    this.authApi.register(this.fullName, this.email, this.password).subscribe({
      next: (response) => {
        this.sessionService.setSession(response);
        this.statusMessage = `Account created for ${response.fullName}.`;
        this.toastService.success(`Account created for ${response.fullName}.`);
        void this.router.navigateByUrl(response.role === 'Admin' ? '/dashboard' : '/');
      },
      error: () => {
        this.statusMessage = 'Register failed. Email may already exist.';
        this.toastService.error('Register failed. Email may already exist.');
      }
    });
  }

  logout(): void {
    const fullName = this.sessionService.session()?.fullName ?? 'User';
    this.sessionService.logout();
    this.statusMessage = 'You have been logged out.';
    this.toastService.info(`${fullName} logged out successfully.`);
  }

  fillUserDemo(): void {
    this.email = 'user@microcommerce.local';
    this.password = 'User@123';
    this.statusMessage = 'Demo user credentials loaded.';
  }

  fillAdminDemo(): void {
    this.email = 'admin@microcommerce.local';
    this.password = 'Admin@123';
    this.statusMessage = 'Demo admin credentials loaded.';
  }
}
