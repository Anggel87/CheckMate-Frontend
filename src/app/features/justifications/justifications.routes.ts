import { Routes } from '@angular/router';

export const JUSTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Justificantes',
      description: 'Revisa documentos y estados de justificación.',
    },
  },
];
