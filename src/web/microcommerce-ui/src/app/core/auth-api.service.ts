import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from './api.config';
import { AuthResponseVm, UserProfileVm } from './store.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<AuthResponseVm> {
    return this.http.post<AuthResponseVm>(`${apiConfig.authBaseUrl}/login`, { email, password });
  }

  register(fullName: string, email: string, password: string): Observable<AuthResponseVm> {
    return this.http.post<AuthResponseVm>(`${apiConfig.authBaseUrl}/register`, { fullName, email, password });
  }

  getProfile(userId: string): Observable<UserProfileVm> {
    return this.http.get<UserProfileVm>(`${apiConfig.authBaseUrl}/profile/${userId}`);
  }
}
