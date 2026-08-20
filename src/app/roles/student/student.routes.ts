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
        data: { permission: 'dashboard.view', topbarTitle: 'Inicio' },
        loadComponent: () =>
          import('../../features/dashboard/pages/student-dashboard/student-dashboard.component').then(
            (component) => component.StudentDashboardComponent,
          ),
      },
      {
        path: 'profile',
        canActivate: [permissionGuard],
        data: { permission: 'profile.view', topbarTitle: 'Mi informacion' },
        loadComponent: () =>
          import('../../features/profile/pages/student-profile/student-profile.component').then(
            (component) => component.StudentProfileComponent,
          ),
      },
      {
        path: 'schedule',
        canActivate: [permissionGuard],
        data: { permission: 'schedule.view', topbarTitle: 'Mi Horario' },
        loadComponent: () =>
          import('../../features/schedules/pages/student-schedule/student-schedule.component').then(
            (component) => component.StudentScheduleComponent,
          ),
      },
      { path: 'schedules', pathMatch: 'full', redirectTo: 'schedule' },
      {
        path: 'teachers',
        canActivate: [permissionGuard],
        data: { permission: 'teachers.view', topbarTitle: 'Mis Profesores' },
        loadComponent: () =>
          import('../../features/teachers/pages/student-teachers/student-teachers.component').then(
            (component) => component.StudentTeachersComponent,
          ),
      },
      {
        path: 'teachers/:teacherId',
        canActivate: [permissionGuard],
        data: { permission: 'teachers.view', topbarTitle: 'Profesor' },
        loadComponent: () =>
          import('../../features/teachers/pages/student-teacher-detail/student-teacher-detail.component').then(
            (component) => component.StudentTeacherDetailComponent,
          ),
      },
      {
        path: 'subjects',
        canActivate: [permissionGuard],
        data: { permission: 'subjects.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Mi informacion' },
            loadComponent: () =>
              import('../../features/subjects/pages/student-subjects/student-subjects.component').then(
                (component) => component.StudentSubjectsComponent,
              ),
          },
          {
            path: ':subjectId',
            data: { topbarTitle: 'Mi informacion' },
            loadComponent: () =>
              import('../../features/subjects/pages/student-subject-detail/student-subject-detail.component').then(
                (component) => component.StudentSubjectDetailComponent,
              ),
          },
        ],
      },
      {
        path: 'attendance',
        canActivate: [permissionGuard],
        data: { permission: 'attendance.view' },
        children: [
          {
            path: '',
            data: { topbarTitle: 'Mis asistencias' },
            loadComponent: () =>
              import('../../features/attendance/pages/student-attendance-overview/student-attendance-overview.component').then(
                (component) => component.StudentAttendanceOverviewComponent,
              ),
          },
          {
            path: 'history',
            data: { topbarTitle: 'Tus asistencias' },
            loadComponent: () =>
              import('../../features/attendance/pages/student-attendance-list/student-attendance-list.component').then(
                (component) => component.StudentAttendanceListComponent,
              ),
          },
          {
            path: 'detail/:attendanceId',
            data: { topbarTitle: 'Mis asistencias' },
            loadComponent: () =>
              import('../../features/attendance/pages/student-attendance-detail/student-attendance-detail.component').then(
                (component) => component.StudentAttendanceDetailComponent,
              ),
          },
        ],
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
              import('../../features/claims/pages/student-claims/student-claims.component').then(
                (component) => component.StudentClaimsComponent,
              ),
          },
          {
            path: 'new',
            data: { topbarTitle: 'Reclamos' },
            loadComponent: () =>
              import('../../features/claims/pages/new-claim/new-claim.component').then(
                (component) => component.NewClaimComponent,
              ),
          },
          {
            path: ':claimId/edit',
            data: { topbarTitle: 'Editar Reclamo' },
            loadComponent: () =>
              import('../../features/claims/pages/edit-claim/edit-claim.component').then(
                (component) => component.EditClaimComponent,
              ),
          },
          {
            path: ':claimId',
            data: { topbarTitle: 'Reclamo' },
            loadComponent: () =>
              import('../../features/claims/pages/student-claim-detail/student-claim-detail.component').then(
                (component) => component.StudentClaimDetailComponent,
              ),
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
              import('../../features/justifications/pages/student-justifications/student-justifications.component').then(
                (component) => component.StudentJustificationsComponent,
              ),
          },
          {
            path: 'select-absence',
            data: { topbarTitle: 'Justificantes' },
            loadComponent: () =>
              import('../../features/justifications/pages/select-absence/select-absence.component').then(
                (component) => component.SelectAbsenceComponent,
              ),
          },
          {
            path: 'new',
            data: { topbarTitle: 'Justificante' },
            loadComponent: () =>
              import('../../features/justifications/pages/new-justification/new-justification.component').then(
                (component) => component.NewJustificationComponent,
              ),
          },
          {
            path: ':justificationId/edit',
            data: { topbarTitle: 'Editar Justificante' },
            loadComponent: () =>
              import('../../features/justifications/pages/edit-justification/edit-justification.component').then(
                (component) => component.EditJustificationComponent,
              ),
          },
          {
            path: ':justificationId',
            data: { topbarTitle: 'Justificante' },
            loadComponent: () =>
              import(
                '../../features/justifications/pages/student-justification-detail/student-justification-detail.component'
              ).then((component) => component.StudentJustificationDetailComponent),
          },
        ],
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
