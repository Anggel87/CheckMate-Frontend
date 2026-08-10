import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'claims', topbarTitle: 'Reclamos' },
  },
  {
    path: ':claimId',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'claim-detail', topbarTitle: 'Reclamo' },
  },
];
