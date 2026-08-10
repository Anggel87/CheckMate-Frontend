import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const STATISTICS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'statistics', topbarTitle: 'Estadisticas' },
  },
];
