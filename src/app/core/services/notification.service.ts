import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { formatApiDate, readId, readString, toRecord } from '../api/api-adapter';
import { CheckmateApiService } from '../api/checkmate-api.service';
import { AuthService } from '../authentication/auth.service';
import { ROUTE_PATHS } from '../constants/route-paths.constants';
import { UserRole } from '../enums/user-role.enum';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  read: boolean;
  route?: string;
}

const NOTIFICATIONS_BASE_PATH: Record<UserRole, string> = {
  [UserRole.ADMIN]: '/administrador',
  [UserRole.CAREER_DIRECTOR]: '/director-carrera',
  [UserRole.TEACHER]: '/profesor',
  [UserRole.TUTOR_TEACHER]: '/profesor',
  [UserRole.STUDENT]: '/alumno',
};

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

    const role = this.authService.currentUser()?.role;

    if (!role) {
      return;
    }

    this.api
      .patch(`${NOTIFICATIONS_BASE_PATH[role]}/notifications/${id}/read`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  markAllAsRead(): void {
    this.notifications()
      .filter((notification) => !notification.read)
      .forEach((notification) => this.markAsRead(notification.id));
  }

  private load(): void {
    const role = this.authService.currentUser()?.role;

    if (!role) {
      this.notificationsState.set([]);
      return;
    }

    this.api
      .getCollection(`${NOTIFICATIONS_BASE_PATH[role]}/notifications`, (item) => this.toNotification(item, role))
      .pipe(catchError(() => of([])))
      .subscribe((notifications) => {
        this.notificationsState.set(notifications);
      });
  }

  private toNotification(value: unknown, role: UserRole): AppNotification {
    const record = toRecord(value);
    const id = readId(record);

    return {
      id,
      title: readString(record, 'title'),
      description: readString(record, 'message'),
      dateLabel: formatApiDate(readString(record, 'sent_at')),
      read: readBooleanLike(record, 'is_read'),
      route: `${ROUTE_PATHS.rolePrefix[role]}/notifications/${id}`,
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
