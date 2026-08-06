export type StudentAttendanceTone = 'present' | 'late' | 'absent' | 'justified';
export type StudentRequestTone = 'pending' | 'review' | 'approved' | 'rejected';
export type StudentMetricTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type StudentBadgeTone =
  | 'present'
  | 'late'
  | 'absent'
  | 'justified'
  | 'pending'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface StudentProfileMock {
  name: string;
  role: string;
  enrollment: string;
  groupCareer: string;
  email: string;
  phone: string;
  guardian: string;
  address: string;
  avatarUrl: string;
  attendanceTotal: number;
}

export interface StudentMetricMock {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: StudentMetricTone;
  trend?: string;
}

export interface StudentCourseMock {
  id: string;
  name: string;
  teacher: string;
  group: string;
  schedule: string;
  location: string;
  attendance: number;
  icon: string;
  tone: StudentMetricTone;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

export interface StudentAttendanceRecordMock {
  id: string;
  date: string;
  subject: string;
  teacher: string;
  status: string;
  statusTone: StudentBadgeTone;
  time: string;
  location?: string;
  justified?: boolean;
}

export interface StudentJustificationMock {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  statusTone: StudentBadgeTone;
  attachments: number;
}

export interface StudentClaimMock {
  id: string;
  date: string;
  title: string;
  description: string;
  status: string;
  statusTone: StudentBadgeTone;
}

export interface StudentAbsenceMock {
  id: string;
  subject: string;
  teacher: string;
  time: string;
}

export interface StudentAbsenceGroupMock {
  date: string;
  absences: StudentAbsenceMock[];
}

export interface StudentCalendarDayMock {
  day: string;
  muted?: boolean;
  selected?: boolean;
  tone?: StudentAttendanceTone;
}

export const STUDENT_PROFILE: StudentProfileMock = {
  name: 'Juan Ramirez',
  role: 'Alumno',
  enrollment: 'ALU-2023-0045',
  groupCareer: '1-A | TICS',
  email: 'jramirez.alu@academia.edu',
  phone: '+52 55 1234 5678',
  guardian: 'Maria Ramirez (Madre)',
  address: 'Av. Insurgentes Sur 1234, Col. Del Valle, Benito Juarez, 03100 Ciudad de Mexico, CDMX',
  avatarUrl: '/profile-avatar.svg',
  attendanceTotal: 98,
};

export const STUDENT_HOME_METRICS: StudentMetricMock[] = [
  {
    label: 'Asistencia General',
    value: '94%',
    detail: 'Optimo',
    trend: '~Optimo',
    icon: 'fa-solid fa-user-check',
    tone: 'success',
  },
  {
    label: 'Retardos',
    value: '2',
    detail: 'Este mes',
    icon: 'fa-regular fa-clock',
    tone: 'warning',
  },
  {
    label: 'Faltas',
    value: '1',
    detail: 'Sin justificar',
    icon: 'fa-regular fa-circle-xmark',
    tone: 'danger',
  },
];

export const STUDENT_CURRENT_COURSE: StudentCourseMock = {
  id: 'base-datos',
  name: 'Base de Datos',
  teacher: 'Prof. Mendoza',
  group: 'Grupo 1-A TICS',
  schedule: '10:00 - 11:30',
  location: 'Lab 3',
  attendance: 94,
  icon: 'fa-solid fa-database',
  tone: 'success',
  presentCount: 38,
  lateCount: 2,
  absentCount: 1,
};

export const STUDENT_QUICK_ACTIONS = [
  {
    label: 'Nuevo Reclamo',
    description: 'Reportar incidencia',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/student/claims/new',
  },
  {
    label: 'Crear Justificante',
    description: 'Subir evidencia medica',
    icon: 'fa-regular fa-file-lines',
    route: '/student/justifications/select-absence',
  },
] as const;

export const STUDENT_ATTENDANCE_RECORDS: StudentAttendanceRecordMock[] = [
  {
    id: 'att-2023-09-28',
    date: '28/Sep/2023',
    subject: 'Base de datos',
    teacher: 'Ing. Carlos Mendoza',
    status: 'Presente',
    statusTone: 'present',
    time: '08:00 AM - 10:00 AM',
    location: 'Edificio T, Lab 4',
  },
  {
    id: 'att-2023-09-27',
    date: '27/Sep/2023',
    subject: 'Redes',
    teacher: 'Mtra. Elena Suarez',
    status: 'Retardo',
    statusTone: 'late',
    time: '10:15 AM',
  },
  {
    id: 'att-2023-09-26',
    date: '26/Sep/2023',
    subject: 'Desarrollo de Software',
    teacher: 'Dr. Roberto Nava',
    status: 'Presente',
    statusTone: 'present',
    time: '10:00 AM',
  },
  {
    id: 'att-2023-09-25',
    date: '25/Sep/2023',
    subject: 'Base de datos',
    teacher: 'Ing. Carlos Mendoza',
    status: 'Falta',
    statusTone: 'absent',
    time: '--:--',
    justified: true,
  },
  {
    id: 'att-2023-09-24',
    date: '24/Sep/2023',
    subject: 'Redes',
    teacher: 'Mtra. Elena Suarez',
    status: 'Falta',
    statusTone: 'absent',
    time: '--:--',
  },
];

export const STUDENT_ATTENDANCE_SUMMARY: StudentMetricMock[] = [
  {
    label: 'Asistencia Total',
    value: '92%',
    detail: 'Excelente estado',
    icon: 'fa-solid fa-percent',
    tone: 'success',
  },
  {
    label: 'Faltas',
    value: '3',
    detail: 'Permitidas: 10',
    icon: 'fa-solid fa-xmark',
    tone: 'danger',
  },
  {
    label: 'Retardos',
    value: '5',
    detail: '3 retardos = 1 falta',
    icon: 'fa-regular fa-clock',
    tone: 'warning',
  },
  {
    label: 'Justificantes',
    value: '2',
    detail: 'Aprobados',
    icon: 'fa-regular fa-calendar-check',
    tone: 'info',
  },
];

export const STUDENT_RECENT_ATTENDANCE: StudentAttendanceRecordMock[] = [
  {
    id: 'recent-math',
    date: 'Hoy, 08:00 AM',
    subject: 'Matematicas Avanzadas',
    teacher: 'M.C. Roberto Mendez',
    status: 'Presente',
    statusTone: 'present',
    time: '08:00 AM',
  },
  {
    id: 'recent-physics',
    date: 'Ayer, 10:15 AM',
    subject: 'Fisica Cuantica',
    teacher: 'Dr. Roberto Gomez',
    status: 'Retardo',
    statusTone: 'late',
    time: '10:15 AM',
  },
  {
    id: 'recent-history',
    date: '06 Oct, 11:30 AM',
    subject: 'Historia Universal',
    teacher: 'Prof. Elena Rodriguez',
    status: 'Falta',
    statusTone: 'absent',
    time: '11:30 AM',
  },
  {
    id: 'recent-chemistry',
    date: '02 Oct, 09:00 AM',
    subject: 'Quimica Organica',
    teacher: 'Dra. Ana Martinez',
    status: 'Justificado',
    statusTone: 'justified',
    time: '09:00 AM',
  },
];

export const STUDENT_CALENDAR_WEEKS: StudentCalendarDayMock[][] = [
  [
    { day: '24', muted: true },
    { day: '25', muted: true },
    { day: '26', muted: true },
    { day: '27', muted: true },
    { day: '28', muted: true },
    { day: '29', muted: true },
    { day: '30', muted: true },
  ],
  [
    { day: '1' },
    { day: '2', tone: 'present' },
    { day: '3', tone: 'present' },
    { day: '4', tone: 'late' },
    { day: '5', tone: 'present' },
    { day: '6', tone: 'absent' },
    { day: '7' },
  ],
  [
    { day: '8' },
    { day: '9', tone: 'justified' },
    { day: '10', selected: true, tone: 'present' },
    { day: '11' },
    { day: '12' },
    { day: '13' },
    { day: '14' },
  ],
];

export const STUDENT_JUSTIFICATIONS: StudentJustificationMock[] = [
  {
    id: 'jus-medical',
    title: 'Cita Medica General',
    description:
      'Adjunto comprobante medico de asistencia a consulta el dia de ayer por motivos de salud.',
    date: '28 Sep 2023',
    status: 'En revision',
    statusTone: 'warning',
    attachments: 1,
  },
  {
    id: 'jus-internet',
    title: 'Problemas de conexion a internet',
    description:
      'No pude asistir a la primera clase debido a un corte general de energia en mi zona.',
    date: '20 Sep 2023',
    status: 'Aprobado',
    statusTone: 'present',
    attachments: 0,
  },
  {
    id: 'jus-traffic',
    title: 'Retraso por trafico',
    description:
      'Llegue 30 minutos tarde a la clase de Base de Datos por un accidente en la via principal.',
    date: '15 Sep 2023',
    status: 'Rechazado',
    statusTone: 'absent',
    attachments: 1,
  },
];

export const STUDENT_CLAIMS: StudentClaimMock[] = [
  {
    id: 'claim-backpack',
    date: '24 Oct, 2023',
    title: 'Robo de mochila',
    description: 'Me tiraron mi mochila a la basura y la llenaron de queso de pizza.',
    status: 'En revision',
    statusTone: 'info',
  },
  {
    id: 'claim-pencil',
    date: '15 Oct, 2023',
    title: 'Robo de lapiz',
    description: 'Desaparecio mi estuche completo en el laboratorio de quimica.',
    status: 'Pendiente',
    statusTone: 'warning',
  },
  {
    id: 'claim-harassment',
    date: '02 Sep, 2023',
    title: 'Acoso escolar',
    description: 'Reporte de incidente en pasillo principal durante receso.',
    status: 'Aprobado',
    statusTone: 'present',
  },
  {
    id: 'claim-lab',
    date: '28 Ago, 2023',
    title: 'Fallo en equipo de laboratorio',
    description: 'Computadora numero 14 no enciende durante la clase de redes.',
    status: 'Aprobado',
    statusTone: 'present',
  },
];

export const STUDENT_SUBJECTS: StudentCourseMock[] = [
  {
    id: 'desarrollo-software',
    name: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    group: '1-A TICS',
    schedule: 'Lun, Mie, Vie • 10:00 - 12:00',
    location: 'Edificio A, Salon 302',
    attendance: 95,
    icon: 'fa-solid fa-code',
    tone: 'success',
    presentCount: 42,
    lateCount: 2,
    absentCount: 1,
  },
  {
    id: 'base-datos-avanzadas',
    name: 'Base de Datos Avanzadas',
    teacher: 'Dra. Elena Castro',
    group: '1-A TICS',
    schedule: 'Mar, Jue • 14:00 - 16:00',
    location: 'Edificio B, Laboratorio 1',
    attendance: 82,
    icon: 'fa-solid fa-database',
    tone: 'warning',
    presentCount: 36,
    lateCount: 5,
    absentCount: 3,
  },
  {
    id: 'redes-computadoras',
    name: 'Redes de Computadoras',
    teacher: 'Ing. Carlos Ruiz',
    group: '1-A TICS',
    schedule: 'Lun, Mie • 16:00 - 18:00',
    location: 'Edificio C, Salon 105',
    attendance: 68,
    icon: 'fa-solid fa-network-wired',
    tone: 'danger',
    presentCount: 30,
    lateCount: 6,
    absentCount: 8,
  },
];

export const STUDENT_SUBJECT_HISTORY: StudentAttendanceRecordMock[] = [
  {
    id: 'subject-10-nov',
    date: 'Viernes, 10 Nov 2023',
    subject: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    status: 'Presente',
    statusTone: 'present',
    time: '10:00 AM',
  },
  {
    id: 'subject-08-nov',
    date: 'Miercoles, 08 Nov 2023',
    subject: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    status: 'Presente',
    statusTone: 'present',
    time: '10:00 AM',
  },
  {
    id: 'subject-06-nov',
    date: 'Lunes, 06 Nov 2023',
    subject: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    status: 'Retardo',
    statusTone: 'late',
    time: '10:15 AM',
  },
  {
    id: 'subject-03-nov',
    date: 'Viernes, 03 Nov 2023',
    subject: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    status: 'Falta',
    statusTone: 'absent',
    time: '10:00 AM',
  },
  {
    id: 'subject-01-nov',
    date: 'Miercoles, 01 Nov 2023',
    subject: 'Desarrollo de Software',
    teacher: 'M.C. Roberto Mendez',
    status: 'Presente',
    statusTone: 'present',
    time: '10:00 AM',
  },
];

export const STUDENT_ABSENCE_GROUPS: StudentAbsenceGroupMock[] = [
  {
    date: '15 de Octubre, 2023',
    absences: [
      {
        id: 'absence-physics-15',
        subject: 'Fisica Avanzada II',
        teacher: 'Prof. Dr. Roberto Gomez',
        time: '08:00 - 10:00',
      },
      {
        id: 'absence-calculus-15',
        subject: 'Calculo Multivariable',
        teacher: 'Prof. Ana Martinez',
        time: '10:30 - 12:30',
      },
    ],
  },
  {
    date: '10 de Octubre, 2023',
    absences: [
      {
        id: 'absence-programming-10',
        subject: 'Programacion Estructurada',
        teacher: 'Prof. Carlos Ruiz',
        time: '14:00 - 16:00',
      },
    ],
  },
];

export const STUDENT_ATTENDANCE_DETAIL = {
  subject: 'Base de datos',
  teacher: 'Prof. Elena Rodriguez',
  status: 'Inasistencia',
  date: '28 de Septiembre, 2023',
  scheduledTime: '08:00 AM - 10:00 AM',
  registeredTime: '--:--',
  classroom: 'Edificio T, Lab 4',
  observations:
    'El alumno no se presento al registro biometrico durante el periodo establecido de tolerancia (15 minutos). No hay registro manual por parte del docente.',
} as const;
