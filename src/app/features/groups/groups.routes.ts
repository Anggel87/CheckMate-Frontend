import { Routes } from '@angular/router';

export const GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Grupos',
      description: 'Organiza grupos académicos y sus relaciones.',
    },
  },
];
