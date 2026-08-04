import { NavigationItem } from '../../../core/models/menu-item.model';

export const STUDENT_MENU: NavigationItem[] = [
  { label: 'Dashboard', icon: 'fa-solid fa-house', route: '/student/dashboard', permission: 'dashboard.view' },
  { label: 'Perfil', icon: 'fa-solid fa-user', route: '/student/profile', permission: 'profile.view' },
  { label: 'Horario', icon: 'fa-solid fa-calendar-days', route: '/student/schedule', permission: 'schedule.view' },
  { label: 'Materias', icon: 'fa-solid fa-book-open', route: '/student/subjects', permission: 'subjects.view' },
  { label: 'Asistencias', icon: 'fa-solid fa-calendar-check', route: '/student/attendance', permission: 'attendance.view' },
  { label: 'Reclamos', icon: 'fa-solid fa-message', route: '/student/claims', permission: 'claims.view' },
  { label: 'Justificantes', icon: 'fa-solid fa-file-circle-question', route: '/student/justifications', permission: 'justifications.view' },
  { label: 'Notificaciones', icon: 'fa-solid fa-bell', route: '/student/notifications', permission: 'notifications.view' },
  { label: 'Emergencias', icon: 'fa-solid fa-shield-halved', route: '/student/emergencies', permission: 'emergencies.view' },
];
