import { Routes } from '@angular/router';

export const CAREERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Carreras',
      description: 'Estructura para administrar programas académicos.',
    },
  },
];
