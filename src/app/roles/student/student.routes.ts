import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const STUDENT_ROUTES: Routes = [
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.STUDENT] },
    loadComponent: () =>
      import('../../layouts/authenticated-layout/authenticated-layout.component').then(
        (component) => component.AuthenticatedLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { permission: 'dashboard.view' },
        loadChildren: () =>
          import('../../features/dashboard/dashboard.routes').then(
            (routes) => routes.DASHBOARD_ROUTES,
          ),
      },
      {
        path: 'profile',
        canActivate: [permissionGuard],
        data: { permission: 'profile.view' },
        loadChildren: () =>
          import('../../features/profile/profile.routes').then((routes) => routes.PROFILE_ROUTES),
      },
      {
        path: 'schedule',
        canActivate: [permissionGuard],
        data: { permission: 'schedule.view' },
        loadChildren: () =>
          import('../../features/schedules/schedules.routes').then(
            (routes) => routes.SCHEDULES_ROUTES,
          ),
      },
      { path: 'schedules', pathMatch: 'full', redirectTo: 'schedule' },
      {
        path: 'subjects',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.view' },
        loadChildren: () =>
          import('../../features/subjects/subjects.routes').then(
            (routes) => routes.SUBJECTS_ROUTES,
          ),
      },
      {
        path: 'attendance',
        canActivate: [permissionGuard],
        data: { permission: 'attendance.view' },
        loadChildren: () =>
          import('../../features/attendance/attendance.routes').then(
            (routes) => routes.ATTENDANCE_ROUTES,
          ),
      },
      {
        path: 'claims',
        canActivate: [permissionGuard],
        data: { permission: 'claims.view' },
        loadChildren: () =>
          import('../../features/claims/claims.routes').then((routes) => routes.CLAIMS_ROUTES),
      },
      {
        path: 'justifications',
        canActivate: [permissionGuard],
        data: { permission: 'justifications.view' },
        loadChildren: () =>
          import('../../features/justifications/justifications.routes').then(
            (routes) => routes.JUSTIFICATIONS_ROUTES,
          ),
      },
      {
        path: 'notifications',
        canActivate: [permissionGuard],
        data: { permission: 'notifications.view' },
        loadChildren: () =>
          import('../../features/notifications/notifications.routes').then(
            (routes) => routes.NOTIFICATIONS_ROUTES,
          ),
      },
      {
        path: 'emergencies',
        canActivate: [permissionGuard],
        data: { permission: 'emergencies.view' },
        loadChildren: () =>
          import('../../features/emergencies/emergencies.routes').then(
            (routes) => routes.EMERGENCIES_ROUTES,
          ),
      },
      {
        path: 'settings',
        canActivate: [permissionGuard],
        data: { permission: 'settings.view' },
        loadChildren: () =>
          import('../../features/settings/settings.routes').then(
            (routes) => routes.SETTINGS_ROUTES,
          ),
      },
    ],
  },
];
