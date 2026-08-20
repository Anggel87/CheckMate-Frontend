import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { roleGuard } from '../../core/guards/role.guard';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

// Crear dispositivos es exclusivo de administrador escolar. El director de
// carrera solo puede consultar el detalle y hacer ping (ver device-edit case,
// que ya oculta el boton de guardar para el resto de los roles).
export const NFC_DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'devices', topbarTitle: 'Dispositivos' },
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], managementView: 'device-create', topbarTitle: 'Nuevo dispositivo' },
    loadComponent: loadManagementWorkspace,
  },
  {
    path: ':deviceId/edit',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'device-edit', topbarTitle: 'Dispositivo' },
  },
];
