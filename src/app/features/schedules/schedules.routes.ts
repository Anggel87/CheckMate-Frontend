import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { roleGuard } from '../../core/guards/role.guard';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

// El CRUD de horarios (crear/editar) es exclusivo de administrador escolar; el
// director de carrera solo tiene la vista de solo lectura en el path base.
export const SCHEDULES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'schedules', topbarTitle: 'Horarios' },
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], managementView: 'schedule-create', topbarTitle: 'Nuevo horario' },
    loadComponent: loadManagementWorkspace,
  },
  {
    path: ':scheduleId/edit',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], managementView: 'schedule-edit', topbarTitle: 'Horario' },
    loadComponent: loadManagementWorkspace,
  },
];
