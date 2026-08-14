import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { authGuard } from '../../core/guards/auth.guard';
import { permissionGuard } from '../../core/guards/permission.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const TUTOR_TEACHER_ROUTES: Routes = [
  {
    path: 'tutor',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.TUTOR_TEACHER] },
    loadComponent: () =>
      import('../../layouts/authenticated-layout/authenticated-layout.component').then(
        (component) => component.AuthenticatedLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [permissionGuard],
        data: { permission: 'dashboard.view', topbarTitle: 'Inicio' },
        loadComponent: () =>
          import('../../features/tutoring/pages/tutor-dashboard/tutor-dashboard.component').then(
            (component) => component.TutorDashboardComponent,
          ),
      },
      {
        path: 'students',
        canActivate: [permissionGuard],
        data: { permission: 'students.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Alumnos tutorados' },
            loadComponent: () =>
              import('../../features/tutoring/pages/tutor-students/tutor-students.component').then(
                (component) => component.TutorStudentsComponent,
              ),
          },
          {
            path: ':studentId/attendance/:recordId',
            data: { topbarTitle: 'Asistencias' },
            loadComponent: () =>
              import(
                '../../features/tutoring/pages/tutor-attendance-record-detail/tutor-attendance-record-detail.component'
              ).then((component) => component.TutorAttendanceRecordDetailComponent),
          },
          {
            path: ':studentId/attendance',
            data: { topbarTitle: 'Asistencias' },
            loadComponent: () =>
              import(
                '../../features/tutoring/pages/tutor-student-attendance/tutor-student-attendance.component'
              ).then((component) => component.TutorStudentAttendanceComponent),
          },
          {
            path: ':studentId/justifications',
            data: { topbarTitle: 'Justificantes' },
            loadComponent: () =>
              import(
                '../../features/tutoring/pages/tutor-student-justifications/tutor-student-justifications.component'
              ).then((component) => component.TutorStudentJustificationsComponent),
          },
          {
            path: ':studentId',
            data: { topbarTitle: 'Perfil alumno' },
            loadComponent: () =>
              import(
                '../../features/tutoring/pages/tutor-student-detail/tutor-student-detail.component'
              ).then((component) => component.TutorStudentDetailComponent),
          },
        ],
      },
      {
        path: 'groups',
        canActivate: [permissionGuard],
        data: { permission: 'groups.view', topbarTitle: 'Tus grupos tutorados' },
        loadComponent: () =>
          import('../../features/tutoring/pages/tutor-dashboard/tutor-dashboard.component').then(
            (component) => component.TutorDashboardComponent,
          ),
      },
      {
        path: 'attendance',
        canActivate: [permissionGuard],
        data: { permission: 'attendance.view', topbarTitle: 'Asistencias' },
        loadComponent: () =>
          import(
            '../../features/tutoring/pages/tutor-attendance-overview/tutor-attendance-overview.component'
          ).then((component) => component.TutorAttendanceOverviewComponent),
      },
      {
        path: 'claims',
        canActivate: [permissionGuard],
        data: { permission: 'claims.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Reclamos' },
            loadComponent: () =>
              import('../../features/claims/pages/tutor-claims/tutor-claims.component').then(
                (component) => component.TutorClaimsComponent,
              ),
          },
          {
            path: ':claimId',
            data: { topbarTitle: 'Detalle reclamo' },
            loadComponent: () =>
              import(
                '../../features/claims/pages/tutor-claim-detail/tutor-claim-detail.component'
              ).then((component) => component.TutorClaimDetailComponent),
          },
        ],
      },
      {
        path: 'justifications',
        canActivate: [permissionGuard],
        data: { permission: 'justifications.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Justificantes' },
            loadComponent: () =>
              import(
                '../../features/justifications/pages/tutor-justifications/tutor-justifications.component'
              ).then((component) => component.TutorJustificationsComponent),
          },
          {
            path: 'new',
            data: { topbarTitle: 'Nuevo justificante' },
            loadComponent: () =>
              import(
                '../../features/justifications/pages/tutor-new-justification/tutor-new-justification.component'
              ).then((component) => component.TutorNewJustificationComponent),
          },
          {
            path: ':justificationId',
            data: { topbarTitle: 'Detalle justificante' },
            loadComponent: () =>
              import(
                '../../features/justifications/pages/tutor-justification-detail/tutor-justification-detail.component'
              ).then((component) => component.TutorJustificationDetailComponent),
          },
        ],
      },
      {
        path: 'incidents',
        canActivate: [permissionGuard],
        data: { permission: 'emergencies.view' },
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
              import(
                '../../features/incidents/pages/teacher-new-incident/teacher-new-incident.component'
              ).then((component) => component.TeacherNewIncidentComponent),
          },
          {
            path: 'emergency-list',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import(
                '../../features/incidents/pages/teacher-emergency-list/teacher-emergency-list.component'
              ).then((component) => component.TeacherEmergencyListComponent),
          },
          {
            path: ':incidentId',
            data: { topbarTitle: 'Incidencias' },
            loadComponent: () =>
              import(
                '../../features/incidents/pages/teacher-incident-detail/teacher-incident-detail.component'
              ).then((component) => component.TeacherIncidentDetailComponent),
          },
        ],
      },
      { path: 'emergencies', pathMatch: 'full', redirectTo: 'incidents' },
      {
        path: 'alerts',
        canActivate: [permissionGuard],
        data: { permission: 'alerts.view' },
        loadChildren: () =>
          import('../../features/alerts/alerts.routes').then((routes) => routes.ALERTS_ROUTES),
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
