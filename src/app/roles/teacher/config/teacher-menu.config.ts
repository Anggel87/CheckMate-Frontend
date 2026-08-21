import { NavigationItem } from '../../../core/models/menu-item.model';

export const TEACHER_MENU: NavigationItem[] = [
  {
    label: 'Dashboard',
    icon: 'fa-solid fa-table-cells-large',
    route: '/teacher/dashboard',
    permission: 'dashboard.view',
  },
  {
    label: 'Tus materias',
    icon: 'fa-solid fa-book-open',
    route: '/teacher/schedule',
    permission: 'schedule.view',
    children: [
      {
        label: 'Pasar lista',
        icon: 'fa-solid fa-clipboard-check',
        route: '/teacher/attendance',
        permission: 'attendance.view',
      },
    ],
  },
  {
    label: 'Tus grupos',
    icon: 'fa-solid fa-users',
    route: '/teacher/groups',
    permission: 'groups.view',
    children: [
      {
        label: 'Alumnos',
        icon: 'fa-solid fa-graduation-cap',
        route: '/teacher/students',
        permission: 'students.view',
      },
    ],
  },
  {
    label: 'Incidencias',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/teacher/incidents',
    permission: 'incidents.view',
  },
  {
    label: 'Notificaciones',
    icon: 'fa-solid fa-bell',
    route: '/teacher/notifications',
    permission: 'notifications.view',
  },
  {
    label: 'Configuración',
    icon: 'fa-solid fa-gear',
    route: '/teacher/settings',
    permission: 'settings.view',
  },
];
