import { Injectable, computed, signal } from '@angular/core';
import { AppNotification, MOCK_NOTIFICATIONS } from '../mocks/notifications.mock';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notificationsState = signal<AppNotification[]>(MOCK_NOTIFICATIONS);

  readonly notifications = this.notificationsState.asReadonly();
  readonly unreadCount = computed(() => this.notifications().filter((notification) => !notification.read).length);

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
}
