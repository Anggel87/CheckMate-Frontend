import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const ACADEMIC_PERIODS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'school-years', topbarTitle: 'Periodos academicos' },
  },
  {
    path: 'new',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'school-year-create', topbarTitle: 'Nuevo periodo academico' },
  },
  {
    path: ':schoolYearId/edit',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'school-year-edit', topbarTitle: 'Periodo academico' },
  },
];
