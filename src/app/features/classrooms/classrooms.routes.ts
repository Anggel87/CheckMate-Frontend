import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const CLASSROOMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'classrooms', topbarTitle: 'Salones' },
  },
  {
    path: 'new',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'classroom-create', topbarTitle: 'Nuevo salon' },
  },
  {
    path: ':classroomId/edit',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'classroom-edit', topbarTitle: 'Salon' },
  },
];
