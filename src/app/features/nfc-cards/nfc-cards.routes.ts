import { Routes } from '@angular/router';

export const NFC_CARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Tarjetas NFC',
      description: 'Vincula tarjetas con alumnos y controla su estado.',
    },
  },
];
