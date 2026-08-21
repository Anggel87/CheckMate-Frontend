import { Routes } from '@angular/router';

export const ADMIN_NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    data: { topbarTitle: 'Notificaciones' },
    loadComponent: () =>
      import('./pages/notifications-sent-list/notifications-sent-list.component').then(
        (component) => component.NotificationsSentListComponent,
      ),
  },
  {
    path: 'new',
    data: { topbarTitle: 'Nueva Notificacion' },
    loadComponent: () =>
      import('./pages/compose-notification/compose-notification.component').then(
        (component) => component.ComposeNotificationComponent,
      ),
  },
  {
    path: ':notificationId',
    data: { topbarTitle: 'Notificacion' },
    loadComponent: () =>
      import('./pages/notification-sent-detail/notification-sent-detail.component').then(
        (component) => component.NotificationSentDetailComponent,
      ),
  },
];
