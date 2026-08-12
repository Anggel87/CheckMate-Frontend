import { Routes } from '@angular/router';

export const AUTHENTICATION_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login-page.component').then((component) => component.LoginPageComponent),
  },
  {
    path: 'callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(
        (component) => component.AuthCallbackComponent,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Recuperar contraseña',
      description: 'Disponible próximamente.',
    },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Restablecer contraseña',
      description: 'Disponible próximamente.',
    },
  },
  {
    path: 'mfa',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Autenticación multifactor',
      description: 'Disponible próximamente.',
    },
  },
];
