import { Routes } from '@angular/router';

export const ACADEMIC_PERIODS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Periodos académicos',
      description: 'Configura ciclos, fechas y estados académicos.',
    },
  },
];
