import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const AUDIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'audit', topbarTitle: 'Auditoria' },
  },
  {
    path: ':entity',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'audit-list', topbarTitle: 'Auditoria' },
  },
];
