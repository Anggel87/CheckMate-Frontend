import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/new-user/new-user.component').then((component) => component.NewUserComponent),
    data: { topbarTitle: 'Nuevo usuario' },
  },
];
