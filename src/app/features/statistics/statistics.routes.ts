import { Routes } from '@angular/router';

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Estadísticas',
      description: 'Visualiza indicadores, tendencias y comparativos.',
    },
  },
];
