import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const TEACHER_ROUTES: Routes = [
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.TEACHER] },
    loadComponent: () =>
      import('../../layouts/authenticated-layout/authenticated-layout.component').then(
        (component) => component.AuthenticatedLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { permission: 'dashboard.view', topbarTitle: 'Dashboard' },
        loadChildren: () =>
          import('../../features/dashboard/dashboard.routes').then(
            (routes) => routes.DASHBOARD_ROUTES,
          ),
      },
      {
        path: 'schedule',
        canActivate: [permissionGuard],
        data: { permission: 'schedule.view', topbarTitle: 'Dashboard' },
        loadComponent: () =>
          import('../../features/schedules/pages/teacher-today-subjects/teacher-today-subjects.component').then(
            (component) => component.TeacherTodaySubjectsComponent,
          ),
      },
      {
        path: 'schedule/:scheduleId/attendance-setting',
        canActivate: [permissionGuard],
        data: { permission: 'schedule.view', topbarTitle: 'Tolerancia de asistencia' },
        loadComponent: () =>
          import('../../features/schedules/pages/teacher-attendance-setting/teacher-attendance-setting.component').then(
            (component) => component.TeacherAttendanceSettingComponent,
          ),
      },
      {
        path: 'students',
        canActivate: [permissionGuard],
        data: { permission: 'students.view' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: '/teacher/groups' },
          {
            path: ':studentId',
            data: { topbarTitle: 'Perfil del alumno' },
            loadComponent: () =>
              import('../../features/students/pages/teacher-student-profile/teacher-student-profile.component').then(
                (component) => component.TeacherStudentProfileComponent,
              ),
          },
          {
            path: ':studentId/attendance',
            data: { topbarTitle: 'Tus grupos' },
            loadComponent: () =>
              import('../../features/students/pages/teacher-student-attendance/teacher-student-attendance.component').then(
                (component) => component.TeacherStudentAttendanceComponent,
              ),
          },
          {
            path: ':studentId/justifications',
            data: { topbarTitle: 'Justificantes' },
            loadComponent: () =>
              import('../../features/students/pages/teacher-student-justifications/teacher-student-justifications.component').then(
                (component) => component.TeacherStudentJustificationsComponent,
              ),
          },
          {
            path: ':studentId/justifications/:justificationId',
            data: { topbarTitle: 'Justificantes' },
            loadComponent: () =>
              import('../../features/students/pages/teacher-justification-detail/teacher-justification-detail.component').then(
                (component) => component.TeacherJustificationDetailComponent,
              ),
          },
        ],
      },
      {
        path: 'groups',
        canActivate: [permissionGuard],
        data: { permission: 'groups.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Mis Grupos' },
            loadComponent: () =>
              import('../../features/groups/pages/teacher-groups/teacher-groups.component').then(
                (component) => component.TeacherGroupsComponent,
              ),
          },
          {
            path: ':groupId/students',
            data: { topbarTitle: 'Tus grupos' },
            loadComponent: () =>
              import('../../features/groups/pages/teacher-group-students/teacher-group-students.component').then(
                (component) => component.TeacherGroupStudentsComponent,
              ),
          },
        ],
      },
      {
        path: 'attendance',
        canActivate: [permissionGuard],
        data: { permission: 'attendance.view' },
        children: [
          { path: '', pathMatch: 'full', redirectTo: '/teacher/schedule' },
          {
            path: 'take/:classId',
            data: { topbarTitle: 'Tus materias' },
            loadComponent: () =>
              import('../../features/attendance/pages/teacher-take-attendance/teacher-take-attendance.component').then(
                (component) => component.TeacherTakeAttendanceComponent,
              ),
          },
        ],
      },
      {
        path: 'incidents',
        canActivate: [permissionGuard],
        data: { permission: 'incidents.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import('../../features/incidents/pages/teacher-incidents/teacher-incidents.component').then(
                (component) => component.TeacherIncidentsComponent,
              ),
          },
          {
            path: 'new',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import('../../features/incidents/pages/teacher-new-incident/teacher-new-incident.component').then(
                (component) => component.TeacherNewIncidentComponent,
              ),
          },
          {
            path: 'emergency-list',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import('../../features/incidents/pages/teacher-emergency-list/teacher-emergency-list.component').then(
                (component) => component.TeacherEmergencyListComponent,
              ),
          },
          {
            path: ':incidentId',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import('../../features/incidents/pages/teacher-incident-detail/teacher-incident-detail.component').then(
                (component) => component.TeacherIncidentDetailComponent,
              ),
          },
        ],
      },
      { path: 'emergencies', pathMatch: 'full', redirectTo: 'incidents/new' },
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
      { path: 'schedules', pathMatch: 'full', redirectTo: 'schedule' },
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
        path: 'profile',
        canActivate: [permissionGuard],
        data: { permission: 'profile.view', topbarTitle: 'Mi informacion' },
        loadComponent: () =>
          import('../../features/profile/pages/teacher-profile/teacher-profile.component').then(
            (component) => component.TeacherProfileComponent,
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
