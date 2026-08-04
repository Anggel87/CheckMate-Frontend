import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Reclamos',
      description: 'Gestiona solicitudes de corrección relacionadas con asistencia.',
    },
  },
];
