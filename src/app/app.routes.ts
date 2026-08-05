import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LANDING_ROUTES } from './features/landing/landing.routes';
import { ADMIN_ROUTES } from './roles/admin/admin.routes';
import { CAREER_DIRECTOR_ROUTES } from './roles/career-director/career-director.routes';
import { STUDENT_ROUTES } from './roles/student/student.routes';
import { TEACHER_ROUTES } from './roles/teacher/teacher.routes';
import { TUTOR_TEACHER_ROUTES } from './roles/tutor-teacher/tutor-teacher.routes';

export const routes: Routes = [
  ...LANDING_ROUTES,
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/guest-layout/guest-layout.component').then(
        (component) => component.GuestLayoutComponent,
      ),
    loadChildren: () =>
      import('./features/authentication/authentication.routes').then(
        (routes) => routes.AUTHENTICATION_ROUTES,
      ),
  },
  ...ADMIN_ROUTES,
  ...CAREER_DIRECTOR_ROUTES,
  ...TEACHER_ROUTES,
  ...TUTOR_TEACHER_ROUTES,
  ...STUDENT_ROUTES,
  {
    path: 'help',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/authenticated-layout/authenticated-layout.component').then(
        (component) => component.AuthenticatedLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/feature-placeholder/feature-placeholder.component').then(
            (component) => component.FeaturePlaceholderComponent,
          ),
        data: {
          title: 'Ayuda',
          description: 'Centro de apoyo preparado para guías, documentación y soporte.',
        },
      },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/components/error-pages/error-pages.component').then(
        (component) => component.ForbiddenPageComponent,
      ),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./shared/components/error-pages/error-pages.component').then(
        (component) => component.NotFoundPageComponent,
      ),
  },
  {
    path: 'server-error',
    loadComponent: () =>
      import('./shared/components/error-pages/error-pages.component').then(
        (component) => component.ServerErrorPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
