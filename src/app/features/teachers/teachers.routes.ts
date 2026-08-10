import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'teachers', topbarTitle: 'Profesores' },
  },
  {
    path: ':teacherId/attendance',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'teacher-attendance', topbarTitle: 'Asistencias' },
  },
  {
    path: ':teacherId',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'teacher-detail', topbarTitle: 'Profesor' },
  },
];
