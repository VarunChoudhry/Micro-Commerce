import { Injectable, computed, signal } from '@angular/core';
import { SessionVm } from './store.models';

const storageKey = 'microcommerce.session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionState = signal<SessionVm | null>(this.restoreSession());

  readonly session = this.sessionState.asReadonly();
  readonly isLoggedIn = computed(() => this.sessionState() !== null);
  readonly roleLabel = computed(() => this.sessionState()?.role ?? 'Guest');

  setSession(session: SessionVm): void {
    this.sessionState.set(session);
    localStorage.setItem(storageKey, JSON.stringify(session));
  }

  logout(): void {
    this.sessionState.set(null);
    localStorage.removeItem(storageKey);
  }

  private restoreSession(): SessionVm | null {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionVm;
    } catch {
      localStorage.removeItem(storageKey);
      return null;
    }
  }
}
