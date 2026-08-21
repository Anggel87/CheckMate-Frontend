import { Routes } from '@angular/router';
import { UserRole } from '../../core/enums/user-role.enum';
import { roleGuard } from '../../core/guards/role.guard';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const SUBJECTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'subjects', topbarTitle: 'Materias' },
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], managementView: 'subject-create', topbarTitle: 'Nueva materia' },
    loadComponent: loadManagementWorkspace,
  },
  {
    path: ':subjectId/edit',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN], managementView: 'subject-edit', topbarTitle: 'Materia' },
    loadComponent: loadManagementWorkspace,
  },
];
