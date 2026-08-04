import { Routes } from '@angular/router';

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Materias',
      description: 'Base para consultar y administrar materias.',
    },
  },
];
