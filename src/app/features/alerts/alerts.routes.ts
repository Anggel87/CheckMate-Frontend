import { Routes } from '@angular/router';

export const ALERTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Alertas académicas',
      description: 'Seguimiento de riesgos, faltas recurrentes y avisos de tutoría.',
    },
  },
];
