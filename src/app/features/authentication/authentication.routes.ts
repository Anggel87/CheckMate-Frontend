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
    path: 'forgot-password',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Recuperar contraseña',
      description: 'Flujo preparado para integrarse con autenticación y API.',
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
      description: 'Pantalla base para restablecimiento de contraseña.',
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
      description: 'Estructura preparada para segundo factor.',
    },
  },
];
