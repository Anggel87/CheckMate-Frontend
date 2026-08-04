import { Routes } from '@angular/router';

export const NFC_DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Dispositivos NFC',
      description: 'Prepara la administración de lectores, ubicaciones y estado operativo.',
    },
  },
];
