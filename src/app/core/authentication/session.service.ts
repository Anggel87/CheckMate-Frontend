import { Injectable, inject, signal } from '@angular/core';
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
    this.storageService.setSession(STORAGE_KEYS.authUser, user);
  }

  updateProfileSummary(avatarUrl: string, shortName: string): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    const nextAvatarUrl = avatarUrl || user.avatarUrl;
    const nextShortName = shortName || user.shortName;

    if (user.avatarUrl === nextAvatarUrl && user.shortName === nextShortName) {
      return;
    }

    const updated = { ...user, avatarUrl: nextAvatarUrl, shortName: nextShortName };
    this.currentUser.set(updated);
    this.storageService.setSession(STORAGE_KEYS.authUser, updated);
  }

  clear(): void {
    this.currentUser.set(null);
    this.storageService.removeSession(STORAGE_KEYS.authUser);
  }

  authToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  tokenType(): string | null {
    return this.currentUser()?.tokenType ?? null;
  }

  private loadInitialUser(): AuthenticatedUser | null {
    return this.storageService.getSession<AuthenticatedUser>(STORAGE_KEYS.authUser);
  }
}
