import { Routes } from '@angular/router';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
        (component) => component.FeaturePlaceholderComponent,
      ),
    data: {
      title: 'Profesores',
      description: 'Consulta y administra docentes, tutorías y asignaciones.',
    },
  },
];
