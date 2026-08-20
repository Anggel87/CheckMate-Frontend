import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const CAREERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'careers', topbarTitle: 'Carreras' },
  },
  {
    path: 'new',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'career-create', topbarTitle: 'Nueva carrera' },
  },
  {
    path: ':careerId/edit',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'career-edit', topbarTitle: 'Carrera' },
  },
];
