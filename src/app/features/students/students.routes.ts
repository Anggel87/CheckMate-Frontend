import { Routes } from '@angular/router';

const loadManagementWorkspace = () =>
  import('../management/pages/management-workspace/management-workspace.component').then(
    (component) => component.ManagementWorkspaceComponent,
  );

export const STUDENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'students', topbarTitle: 'Alumnos' },
  },
  {
    path: ':studentId/attendance',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'student-attendance', topbarTitle: 'Asistencias' },
  },
  {
    path: ':studentId/justifications',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'student-justifications', topbarTitle: 'Justificantes' },
  },
  {
    path: ':studentId',
    loadComponent: loadManagementWorkspace,
    data: { managementView: 'student-detail', topbarTitle: 'Alumno' },
  },
];
