import { Routes } from '@angular/router';

export const INCIDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Incidencias',
      description: 'Registra y consulta eventos que requieren atención académica.',
    },
  },
];
