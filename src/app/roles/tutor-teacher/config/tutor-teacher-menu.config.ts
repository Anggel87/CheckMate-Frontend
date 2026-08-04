import { NavigationItem } from '../../../core/models/menu-item.model';

export const TUTOR_TEACHER_MENU: NavigationItem[] = [
  { label: 'Dashboard', icon: 'fa-solid fa-house', route: '/tutor/dashboard', permission: 'dashboard.view' },
  { label: 'Alumnos tutorados', icon: 'fa-solid fa-user-group', route: '/tutor/students', permission: 'students.view' },
  { label: 'Grupos', icon: 'fa-solid fa-users', route: '/tutor/groups', permission: 'groups.view' },
  { label: 'Asistencias', icon: 'fa-solid fa-calendar-check', route: '/tutor/attendance', permission: 'attendance.view' },
  { label: 'Reclamos', icon: 'fa-solid fa-message', route: '/tutor/claims', permission: 'claims.view' },
  { label: 'Justificantes', icon: 'fa-solid fa-file-circle-question', route: '/tutor/justifications', permission: 'justifications.view' },
  { label: 'Alertas académicas', icon: 'fa-solid fa-bell', route: '/tutor/alerts', permission: 'alerts.view' },
  { label: 'Estadísticas', icon: 'fa-solid fa-chart-line', route: '/tutor/statistics', permission: 'statistics.view' },
  { label: 'Notificaciones', icon: 'fa-solid fa-inbox', route: '/tutor/notifications', permission: 'notifications.view' },
  { label: 'Emergencias', icon: 'fa-solid fa-shield-halved', route: '/tutor/emergencies', permission: 'emergencies.view' },
];
