import { NavigationItem } from '../../../core/models/menu-item.model';

export const CAREER_DIRECTOR_MENU: NavigationItem[] = [
  { label: 'Dashboard', icon: 'fa-solid fa-house', route: '/director/dashboard', permission: 'dashboard.view' },
  { label: 'Alumnos', icon: 'fa-solid fa-user-graduate', route: '/director/students', permission: 'students.view' },
  { label: 'Profesores', icon: 'fa-solid fa-chalkboard-user', route: '/director/teachers', permission: 'teachers.view' },
  { label: 'Grupos', icon: 'fa-solid fa-users', route: '/director/groups', permission: 'groups.view' },
  { label: 'Materias', icon: 'fa-solid fa-book-open', route: '/director/subjects', permission: 'subjects.view' },
  { label: 'Horarios', icon: 'fa-solid fa-calendar-days', route: '/director/schedules', permission: 'schedules.view' },
  { label: 'Asistencias', icon: 'fa-solid fa-calendar-check', route: '/director/attendance', permission: 'attendance.view' },
  { label: 'Dispositivos', icon: 'fa-solid fa-microchip', route: '/director/nfc-devices', permission: 'nfc-devices.view' },
  { label: 'Incidencias', icon: 'fa-solid fa-triangle-exclamation', route: '/director/incidents', permission: 'incidents.view' },
  { label: 'Reclamos', icon: 'fa-solid fa-message', route: '/director/claims', permission: 'claims.view' },
  { label: 'Justificantes', icon: 'fa-solid fa-file-circle-question', route: '/director/justifications', permission: 'justifications.view' },
  { label: 'Reportes', icon: 'fa-solid fa-chart-simple', route: '/director/reports', permission: 'reports.view' },
  { label: 'Estadisticas', icon: 'fa-solid fa-chart-line', route: '/director/statistics', permission: 'statistics.view' },
  { label: 'Auditoria', icon: 'fa-solid fa-clipboard-list', route: '/director/audit', permission: 'audit.view' },
];
