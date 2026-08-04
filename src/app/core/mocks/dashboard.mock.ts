import { QuickAction } from '../models/menu-item.model';
import { UserRole } from '../enums/user-role.enum';

export interface DashboardMetric {
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  trend?: string;
}

export interface DashboardActivity {
  title: string;
  description: string;
  date: string;
  icon: string;
}

export interface TodayClass {
  group: string;
  subject: string;
  time: string;
  status: 'active' | 'pending' | 'completed';
}

export interface DashboardStudent {
  name: string;
  enrollment: string;
  status: 'present' | 'late' | 'absent' | 'pending';
}

export const DASHBOARD_METRICS_BY_ROLE: Record<UserRole, DashboardMetric[]> = {
  [UserRole.ADMIN]: [
    { title: 'Alumnos registrados', value: '1,248', description: 'Activos en el sistema', icon: 'fa-solid fa-user-graduate', tone: 'info', trend: '+3.4%' },
    { title: 'Clases de hoy', value: '42', description: 'Programadas', icon: 'fa-solid fa-calendar-days', tone: 'neutral' },
    { title: 'Asistencias del día', value: '91%', description: 'Promedio general', icon: 'fa-solid fa-clipboard-check', tone: 'success', trend: '+1.2%' },
    { title: 'Pendientes por revisar', value: '18', description: 'Justificantes y reclamos', icon: 'fa-solid fa-inbox', tone: 'warning' },
  ],
  [UserRole.CAREER_DIRECTOR]: [
    { title: 'Alumnos de carrera', value: '326', description: 'TICS', icon: 'fa-solid fa-user-graduate', tone: 'info' },
    { title: 'Grupos activos', value: '12', description: 'Periodo actual', icon: 'fa-solid fa-users', tone: 'neutral' },
    { title: 'Asistencia semanal', value: '93%', description: 'Promedio de carrera', icon: 'fa-solid fa-chart-line', tone: 'success', trend: '+1.8%' },
    { title: 'Alertas académicas', value: '7', description: 'Requieren seguimiento', icon: 'fa-solid fa-triangle-exclamation', tone: 'warning' },
  ],
  [UserRole.TEACHER]: [
    { title: 'Incidencias hoy', value: '3', description: 'Requieren atención', icon: 'fa-solid fa-triangle-exclamation', tone: 'danger', trend: '+2%' },
    { title: 'Por revisar', value: '5', description: 'Justificantes', icon: 'fa-solid fa-file', tone: 'neutral' },
    { title: 'Clases hoy', value: '4', description: 'En horario', icon: 'fa-solid fa-users', tone: 'neutral' },
    { title: 'Asistencia mes', value: '94%', description: 'Promedio de grupos', icon: 'fa-solid fa-chart-simple', tone: 'success', trend: '+1.5%' },
  ],
  [UserRole.TUTOR_TEACHER]: [
    { title: 'Alumnos tutorados', value: '34', description: 'Grupo asignado', icon: 'fa-solid fa-user-group', tone: 'info' },
    { title: 'Faltas recurrentes', value: '6', description: 'Necesitan seguimiento', icon: 'fa-solid fa-circle-exclamation', tone: 'danger' },
    { title: 'Justificantes', value: '9', description: 'Pendientes', icon: 'fa-solid fa-file-circle-question', tone: 'warning' },
    { title: 'Asistencia semanal', value: '92%', description: 'Grupo tutorado', icon: 'fa-solid fa-chart-simple', tone: 'success' },
  ],
  [UserRole.STUDENT]: [
    { title: 'Asistencia mensual', value: '96%', description: 'Promedio personal', icon: 'fa-solid fa-calendar-check', tone: 'success' },
    { title: 'Materias activas', value: '6', description: 'Periodo actual', icon: 'fa-solid fa-book-open', tone: 'info' },
    { title: 'Faltas', value: '2', description: 'Sin justificar', icon: 'fa-solid fa-xmark', tone: 'danger' },
    { title: 'Solicitudes', value: '1', description: 'En revisión', icon: 'fa-solid fa-file-circle-question', tone: 'warning' },
  ],
};

export const QUICK_ACTIONS_BY_ROLE: Record<UserRole, QuickAction[]> = {
  [UserRole.ADMIN]: [
    { label: 'Crear alumno', icon: 'fa-solid fa-user-plus', route: '/admin/students', permission: 'students.view', variant: 'primary' },
    { label: 'Registrar profesor', icon: 'fa-solid fa-chalkboard-user', route: '/admin/teachers', permission: 'teachers.view' },
    { label: 'Crear grupo', icon: 'fa-solid fa-users', route: '/admin/groups', permission: 'groups.view' },
    { label: 'Ver reportes', icon: 'fa-solid fa-chart-simple', route: '/admin/reports', permission: 'reports.view' },
  ],
  [UserRole.CAREER_DIRECTOR]: [
    { label: 'Ver alumnos', icon: 'fa-solid fa-user-graduate', route: '/director/students', permission: 'students.view' },
    { label: 'Revisar grupos', icon: 'fa-solid fa-users', route: '/director/groups', permission: 'groups.view' },
    { label: 'Consultar reportes', icon: 'fa-solid fa-chart-simple', route: '/director/reports', permission: 'reports.view' },
    { label: 'Ver emergencias', icon: 'fa-solid fa-shield-halved', route: '/director/emergencies', permission: 'emergencies.view' },
  ],
  [UserRole.TEACHER]: [
    { label: 'Tomar asistencia', icon: 'fa-solid fa-clipboard-check', route: '/teacher/attendance', permission: 'attendance.view', variant: 'primary' },
    { label: 'Ver mis grupos', icon: 'fa-solid fa-users', route: '/teacher/groups', permission: 'groups.view' },
    { label: 'Consultar horario', icon: 'fa-solid fa-calendar-days', route: '/teacher/schedule', permission: 'schedule.view' },
    { label: 'Revisar justificantes', icon: 'fa-solid fa-file-circle-question', route: '/teacher/justifications', permission: 'justifications.view' },
  ],
  [UserRole.TUTOR_TEACHER]: [
    { label: 'Ver tutorados', icon: 'fa-solid fa-user-group', route: '/tutor/students', permission: 'students.view', variant: 'primary' },
    { label: 'Revisar faltas', icon: 'fa-solid fa-triangle-exclamation', route: '/tutor/attendance', permission: 'attendance.view' },
    { label: 'Justificantes', icon: 'fa-solid fa-file-circle-question', route: '/tutor/justifications', permission: 'justifications.view' },
    { label: 'Alertas académicas', icon: 'fa-solid fa-bell', route: '/tutor/alerts', permission: 'alerts.view' },
  ],
  [UserRole.STUDENT]: [
    { label: 'Ver asistencias', icon: 'fa-solid fa-calendar-check', route: '/student/attendance', permission: 'attendance.view', variant: 'primary' },
    { label: 'Consultar horario', icon: 'fa-solid fa-calendar-days', route: '/student/schedule', permission: 'schedule.view' },
    { label: 'Enviar justificante', icon: 'fa-solid fa-file-arrow-up', route: '/student/justifications', permission: 'justifications.view' },
    { label: 'Crear reclamo', icon: 'fa-solid fa-message', route: '/student/claims', permission: 'claims.view' },
  ],
};

export const RECENT_ACTIVITY: DashboardActivity[] = [
  {
    title: 'Asistencia actualizada',
    description: 'Base de datos registró 28 alumnos presentes.',
    date: 'Hace 12 minutos',
    icon: 'fa-solid fa-clipboard-check',
  },
  {
    title: 'Justificante recibido',
    description: 'Saul Cabrera envió un documento para revisión.',
    date: 'Hace 40 minutos',
    icon: 'fa-solid fa-file-circle-question',
  },
  {
    title: 'Reporte generado',
    description: 'Se preparó el resumen semanal del grupo 1-A.',
    date: 'Hoy, 10:15',
    icon: 'fa-solid fa-chart-simple',
  },
];

export const TODAY_CLASSES: TodayClass[] = [
  { group: '1-A', subject: 'Base de datos', time: '17:00 a 18:40', status: 'active' },
  { group: '2-B', subject: 'Programación Web', time: '18:40 a 20:00', status: 'pending' },
  { group: '2-A', subject: 'Redes', time: '20:00 a 20:50', status: 'pending' },
  { group: '1-B', subject: 'Tutoría', time: 'Completada 15:00', status: 'completed' },
];

export const DASHBOARD_STUDENTS: DashboardStudent[] = [
  { name: 'Juan Ramírez', enrollment: '2021045', status: 'present' },
  { name: 'Saul Cabrera', enrollment: '2021089', status: 'absent' },
  { name: 'Cesar López', enrollment: '2021112', status: 'present' },
  { name: 'Rodrigo Martínez', enrollment: '2021178', status: 'late' },
];
