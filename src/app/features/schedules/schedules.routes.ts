import { Routes } from '@angular/router';

export const SCHEDULES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Horarios',
      description: 'Consulta clases, aulas y sesiones programadas.',
    },
  },
];
