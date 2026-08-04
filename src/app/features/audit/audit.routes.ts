import { Routes } from '@angular/router';

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Auditoría',
      description: 'Consulta trazabilidad de acciones relevantes del sistema.',
    },
  },
];
