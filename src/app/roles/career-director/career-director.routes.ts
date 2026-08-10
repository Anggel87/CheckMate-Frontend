import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const CAREER_DIRECTOR_ROUTES: Routes = [
  {
    path: 'director',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.CAREER_DIRECTOR] },
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
        path: 'students',
        canActivate: [permissionGuard],
        data: { permission: 'students.view' },
        loadChildren: () =>
          import('../../features/students/students.routes').then(
            (routes) => routes.STUDENTS_ROUTES,
          ),
      },
      {
        path: 'teachers',
        canActivate: [permissionGuard],
        data: { permission: 'teachers.view' },
        loadChildren: () =>
          import('../../features/teachers/teachers.routes').then(
            (routes) => routes.TEACHERS_ROUTES,
          ),
      },
      {
        path: 'groups',
        canActivate: [permissionGuard],
        data: { permission: 'groups.view' },
        loadChildren: () =>
          import('../../features/groups/groups.routes').then((routes) => routes.GROUPS_ROUTES),
      },
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
        path: 'schedules',
        canActivate: [permissionGuard],
        data: { permission: 'schedules.view' },
        loadChildren: () =>
          import('../../features/schedules/schedules.routes').then(
            (routes) => routes.SCHEDULES_ROUTES,
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
        path: 'nfc-devices',
        canActivate: [permissionGuard],
        data: { permission: 'nfc-devices.view' },
        loadChildren: () =>
          import('../../features/nfc-devices/nfc-devices.routes').then(
            (routes) => routes.NFC_DEVICES_ROUTES,
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
        path: 'incidents',
        canActivate: [permissionGuard],
        data: { permission: 'incidents.view' },
        loadChildren: () =>
          import('../../features/incidents/incidents.routes').then(
            (routes) => routes.INCIDENTS_ROUTES,
          ),
      },
      {
        path: 'reports',
        canActivate: [permissionGuard],
        data: { permission: 'reports.view' },
        loadChildren: () =>
          import('../../features/reports/reports.routes').then((routes) => routes.REPORTS_ROUTES),
      },
      {
        path: 'statistics',
        canActivate: [permissionGuard],
        data: { permission: 'statistics.view' },
        loadChildren: () =>
          import('../../features/statistics/statistics.routes').then(
            (routes) => routes.STATISTICS_ROUTES,
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
        path: 'audit',
        canActivate: [permissionGuard],
        data: { permission: 'audit.view' },
        loadChildren: () =>
          import('../../features/audit/audit.routes').then((routes) => routes.AUDIT_ROUTES),
      },
      { path: 'emergencies', pathMatch: 'full', redirectTo: 'incidents/new' },
      {
        path: 'profile',
        canActivate: [permissionGuard],
        data: { permission: 'profile.view' },
        loadChildren: () =>
          import('../../features/profile/profile.routes').then((routes) => routes.PROFILE_ROUTES),
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
