import { NavigationItem } from '../../../core/models/menu-item.model';

export const TUTOR_TEACHER_MENU: NavigationItem[] = [
  {
    label: 'Inicio',
    icon: 'fa-solid fa-table-cells-large',
    route: '/tutor/dashboard',
    permission: 'dashboard.view',
  },
  {
    label: 'Alumnos tutorados',
    icon: 'fa-regular fa-user',
    route: '/tutor/students',
    permission: 'students.view',
  },
  {
    label: 'Tus materias',
    icon: 'fa-solid fa-book-open',
    route: '/tutor/schedule',
    permission: 'schedule.view',
  },
  {
    label: 'Reclamos',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/tutor/claims',
    permission: 'claims.view',
  },
  {
    label: 'Justificantes',
    icon: 'fa-regular fa-file-lines',
    route: '/tutor/justifications',
    permission: 'justifications.view',
  },
  {
    label: 'Asistencias',
    icon: 'fa-regular fa-calendar-check',
    route: '/tutor/attendance',
    permission: 'attendance.view',
  },
  {
    label: 'Incidencias',
    icon: 'fa-solid fa-shield-halved',
    route: '/tutor/incidents',
    permission: 'emergencies.view',
  },
  {
    label: 'Notificaciones',
    icon: 'fa-solid fa-bell',
    route: '/tutor/notifications',
    permission: 'notifications.view',
  },
];
