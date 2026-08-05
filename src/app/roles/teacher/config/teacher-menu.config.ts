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
  },
  {
    label: 'Tus grupos',
    icon: 'fa-solid fa-users',
    route: '/teacher/groups',
    permission: 'groups.view',
  },
  {
    label: 'Incidencias',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/teacher/incidents',
    permission: 'incidents.view',
  },
  {
    label: 'Configuración',
    icon: 'fa-solid fa-gear',
    route: '/teacher/settings',
    permission: 'settings.view',
  },
];
