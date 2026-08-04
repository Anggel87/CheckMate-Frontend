import { Injectable, inject, signal } from '@angular/core';
import { CHECKMATE_DEV_USER } from '../mocks/auth.mock';
import { AuthenticatedUser } from '../models/authenticated-user.model';
import { STORAGE_KEYS } from '../constants/storage-keys.constants';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly storageService = inject(StorageService);

  readonly currentUser = signal<AuthenticatedUser | null>(this.loadInitialUser());

  setUser(user: AuthenticatedUser): void {
    this.currentUser.set(user);
    this.storageService.set(STORAGE_KEYS.authUser, user);
  }

  clear(): void {
    this.currentUser.set(null);
    this.storageService.remove(STORAGE_KEYS.authUser);
  }

  authToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  private loadInitialUser(): AuthenticatedUser | null {
    return this.storageService.get<AuthenticatedUser>(STORAGE_KEYS.authUser) ?? CHECKMATE_DEV_USER;
  }
}
