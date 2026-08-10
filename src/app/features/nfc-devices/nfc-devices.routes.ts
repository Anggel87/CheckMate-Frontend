import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const NFC_DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'devices', topbarTitle: 'Dispositivos' },
  },
  {
    path: 'new',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'device-edit', topbarTitle: 'Nuevo dispositivo' },
  },
  {
    path: ':deviceId/edit',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'device-edit', topbarTitle: 'Dispositivo' },
  },
];
