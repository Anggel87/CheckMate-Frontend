import { Routes } from '@angular/router';

export const EMERGENCIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Emergencias',
      description: 'Base para monitoreo y conteo de alumnos en eventos críticos.',
    },
  },
];
