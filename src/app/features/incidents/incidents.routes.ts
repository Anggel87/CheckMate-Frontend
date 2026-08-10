import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const INCIDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'incidents', topbarTitle: 'Incidencias' },
  },
  {
    path: 'new',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'incident-new', topbarTitle: 'Nuevo incidente' },
  },
  {
    path: 'active',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'incident-attendance', topbarTitle: 'Pase de lista' },
  },
  {
    path: ':incidentId/attendance',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'incident-attendance', topbarTitle: 'Pase de lista' },
  },
  {
    path: ':incidentId',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'incident-detail', topbarTitle: 'Incidencia' },
  },
];
