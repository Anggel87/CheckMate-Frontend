import { NavigationItem } from '../../../core/models/menu-item.model';

export const STUDENT_MENU: NavigationItem[] = [
  {
    label: 'Inicio',
    icon: 'fa-solid fa-table-cells-large',
    route: '/student/dashboard',
    permission: 'dashboard.view',
  },
  {
    label: 'Horario',
    icon: 'fa-solid fa-calendar-days',
    route: '/student/schedule',
    permission: 'schedule.view',
  },
  {
    label: 'Profesores',
    icon: 'fa-solid fa-chalkboard-user',
    route: '/student/teachers',
    permission: 'teachers.view',
  },
  {
    label: 'Reclamos',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/student/claims',
    permission: 'claims.view',
  },
  {
    label: 'Justificantes',
    icon: 'fa-regular fa-file-lines',
    route: '/student/justifications',
    permission: 'justifications.view',
  },
  {
    label: 'Asistencias',
    icon: 'fa-regular fa-calendar-check',
    route: '/student/attendance',
    permission: 'attendance.view',
  },
  {
    label: 'Informacion',
    icon: 'fa-regular fa-user',
    route: '/student/profile',
    permission: 'profile.view',
    children: [
      {
        label: 'Materias',
        icon: 'fa-solid fa-book-open',
        route: '/student/subjects',
        permission: 'subjects.view',
      },
    ],
  },
];
