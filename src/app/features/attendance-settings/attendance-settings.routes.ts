import { Routes } from '@angular/router';

export const ATTENDANCE_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Reglas de asistencia',
      description: 'Configura tolerancias, estados y reglas del pase de lista.',
    },
  },
];
