import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import {
  formatApiDate,
  readId,
  readString,
  toRecord,
} from '../api/api-adapter';
import { CheckmateApiService } from '../api/checkmate-api.service';
import { AuthService } from '../authentication/auth.service';
import { UserRole } from '../enums/user-role.enum';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  read: boolean;
  route?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly api = inject(CheckmateApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationsState = signal<AppNotification[]>([]);

  readonly notifications = this.notificationsState.asReadonly();
  readonly unreadCount = computed(() => this.notifications().filter((notification) => !notification.read).length);

  constructor() {
    this.load();
  }

  markAsRead(id: string): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  markAllAsRead(): void {
    this.notificationsState.update((notifications) =>
      notifications.map((notification) => ({ ...notification, read: true })),
    );
  }

  private load(): void {
    if (this.authService.currentUser()?.role !== UserRole.ADMIN) {
      this.notificationsState.set([]);
      return;
    }

    this.api
      .getCollection('/administrador/notifications', (item) => this.toNotification(item))
      .pipe(catchError(() => of([])))
      .subscribe((notifications) => {
        this.notificationsState.set(notifications);
      });
  }

  private toNotification(value: unknown): AppNotification {
    const record = toRecord(value);

    return {
      id: readId(record),
      title: readString(record, 'title'),
      description: readString(record, 'message'),
      dateLabel: formatApiDate(readString(record, 'created_at')),
      read: readBooleanLike(record, 'is_read'),
      route: undefined,
    };
  }
}

function readBooleanLike(record: Record<string, unknown> | null | undefined, key: string): boolean {
  const value = record?.[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true';
  }

  return false;
}
