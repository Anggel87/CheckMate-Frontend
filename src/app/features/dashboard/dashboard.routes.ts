import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/welcome-dashboard/welcome-dashboard.component').then(
        (component) => component.WelcomeDashboardComponent,
      ),
  },
];
