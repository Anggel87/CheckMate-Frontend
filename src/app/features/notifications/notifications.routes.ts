import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    data: { topbarTitle: 'Notificaciones' },
    loadComponent: () =>
      import('./pages/notifications-inbox/notifications-inbox.component').then(
        (component) => component.NotificationsInboxComponent,
      ),
  },
  {
    path: ':notificationId',
    data: { topbarTitle: 'Notificacion' },
    loadComponent: () =>
      import('./pages/notification-inbox-detail/notification-inbox-detail.component').then(
        (component) => component.NotificationInboxDetailComponent,
      ),
  },
];
