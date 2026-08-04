export interface AppNotification {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  read: boolean;
  route?: string;
}

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notification-1',
    title: 'Clase próxima',
    description: 'Base de datos inicia en 15 minutos.',
    dateLabel: 'Ahora',
    read: false,
    route: '/teacher/schedules',
  },
  {
    id: 'notification-2',
    title: 'Justificante pendiente',
    description: 'Un alumno solicitó revisión de asistencia.',
    dateLabel: 'Hace 20 min',
    read: false,
    route: '/teacher/justifications',
  },
  {
    id: 'notification-3',
    title: 'Reporte disponible',
    description: 'El resumen semanal ya puede consultarse.',
    dateLabel: 'Ayer',
    read: true,
    route: '/teacher/statistics',
  },
];
