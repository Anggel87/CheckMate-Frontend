import { NavigationItem } from '../../../core/models/menu-item.model';

export const TEACHER_MENU: NavigationItem[] = [
  { label: 'Dashboard', icon: 'fa-solid fa-house', route: '/teacher/dashboard', permission: 'dashboard.view' },
  { label: 'Horario', icon: 'fa-solid fa-calendar-days', route: '/teacher/schedule', permission: 'schedule.view' },
  { label: 'Grupos', icon: 'fa-solid fa-users', route: '/teacher/groups', permission: 'groups.view' },
  { label: 'Asistencias', icon: 'fa-solid fa-calendar-check', route: '/teacher/attendance', permission: 'attendance.view' },
  { label: 'Reclamos', icon: 'fa-solid fa-message', route: '/teacher/claims', permission: 'claims.view' },
  { label: 'Justificantes', icon: 'fa-solid fa-file-circle-question', route: '/teacher/justifications', permission: 'justifications.view' },
  { label: 'Estadísticas', icon: 'fa-solid fa-chart-line', route: '/teacher/statistics', permission: 'statistics.view' },
  { label: 'Notificaciones', icon: 'fa-solid fa-bell', route: '/teacher/notifications', permission: 'notifications.view' },
  { label: 'Emergencias', icon: 'fa-solid fa-shield-halved', route: '/teacher/emergencies', permission: 'emergencies.view' },
];
