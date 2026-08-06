export type TeacherStatusTone =
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

export type AttendanceMark = 'present' | 'late' | 'absent' | 'justified';

export interface TeacherClassMock {
  id: string;
  start: string;
  end: string;
  group: string;
  classroom: string;
  subject: string;
  status: 'done' | 'active' | 'next';
  countdown?: string;
}

export interface TeacherGroupMock {
  id: string;
  group: string;
  career: string;
  subject: string;
  description: string;
  students: number;
}

export interface TeacherStudentMock {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  group: string;
  status: string;
  statusTone: TeacherStatusTone;
  attendance: number;
  avatarUrl?: string;
}

export interface TeacherAttendanceStudentMock {
  id: string;
  name: string;
  enrollment: string;
  avatarUrl: string;
  status: AttendanceMark;
  disabled?: boolean;
}

export interface TeacherIncidentMock {
  id: string;
  type: string;
  title: string;
  date: string;
  location: string;
  reporter: string;
  priority: string;
  tone: TeacherStatusTone;
  icon: string;
}

export interface TeacherJustificationHistoryMock {
  id: string;
  date: string;
  type: string;
  typeTone: TeacherStatusTone;
  subject: string;
  evidenceIcon: string;
}

export interface TeacherAttendanceHistoryMock {
  id: string;
  date: string;
  subject: string;
  time: string;
  status: string;
  statusTone: TeacherStatusTone;
}

export const TEACHER_TODAY_CLASSES: TeacherClassMock[] = [
  {
    id: 'programacion-avanzada',
    start: '08:00',
    end: '09:40',
    group: 'Grupo 3-B',
    classroom: 'Aula 102',
    subject: 'Programación Avanzada',
    status: 'done',
  },
  {
    id: 'base-datos',
    start: '10:00',
    end: '11:40',
    group: 'Grupo 1-A',
    classroom: 'Lab 4',
    subject: 'Base de Datos',
    status: 'active',
    countdown: 'En 45 min',
  },
  {
    id: 'sistemas-operativos',
    start: '12:00',
    end: '13:40',
    group: 'Grupo 2-C',
    classroom: 'Aula 205',
    subject: 'Sistemas Operativos',
    status: 'next',
  },
];

export const TEACHER_GROUPS: TeacherGroupMock[] = [
  {
    id: '1-a',
    group: '1-A',
    career: 'TICS',
    subject: 'Introducción a las TIC',
    description: 'Conceptos fundamentales de hardware, software y redes...',
    students: 32,
  },
  {
    id: '1-b',
    group: '1-B',
    career: 'TICS',
    subject: 'Algoritmos y Estructuras',
    description: 'Lógica de programación y estructuras de datos básicas...',
    students: 28,
  },
  {
    id: '2-a',
    group: '2-A',
    career: 'MECATRÓNICA',
    subject: 'Física Mecánica',
    description: 'Estudio del movimiento, fuerzas, trabajo, energía y...',
    students: 35,
  },
  {
    id: '3-c',
    group: '3-C',
    career: 'ADMINISTRACIÓN',
    subject: 'Contabilidad Financiera',
    description: 'Principios contables, registro de operaciones y elaboración de...',
    students: 40,
  },
];

export const TEACHER_GROUP_STUDENTS: TeacherStudentMock[] = [
  {
    id: 'juan-ramirez',
    name: 'Juan Ramírez',
    email: 'jramirez@uni.edu',
    enrollment: 'MAT-2023-001',
    group: '1-A',
    status: 'Activo',
    statusTone: 'present',
    attendance: 95,
    avatarUrl: '/profile-avatar.svg',
  },
  {
    id: 'saul-cabrera',
    name: 'Saúl Cabrera',
    email: 'scabrera@uni.edu',
    enrollment: 'MAT-2023-042',
    group: '1-A',
    status: 'Riesgo',
    statusTone: 'late',
    attendance: 78,
  },
  {
    id: 'cesar-lopez',
    name: 'Cesar Lopez',
    email: 'clopez@uni.edu',
    enrollment: 'MAT-2023-018',
    group: '1-A',
    status: 'Activo',
    statusTone: 'present',
    attendance: 90,
    avatarUrl: '/profile-avatar.svg',
  },
  {
    id: 'rodrigo-martinez',
    name: 'Rodrigo Martinez',
    email: 'rmartinez@uni.edu',
    enrollment: 'MAT-2023-088',
    group: '1-A',
    status: 'Baja Temp.',
    statusTone: 'absent',
    attendance: 60,
  },
];

export const TEACHER_ATTENDANCE_STUDENTS: TeacherAttendanceStudentMock[] = [
  {
    id: 'pedri-gonzalez',
    name: 'Pedri González',
    enrollment: '20210045',
    avatarUrl: '/profile-avatar.svg',
    status: 'present',
  },
  {
    id: 'gavi-paez',
    name: 'Gavi Páez',
    enrollment: '20210046',
    avatarUrl: '/profile-avatar.svg',
    status: 'absent',
  },
  {
    id: 'luis-suarez',
    name: 'Luis Suárez',
    enrollment: '20210047',
    avatarUrl: '/profile-avatar.svg',
    status: 'justified',
    disabled: true,
  },
  {
    id: 'saul-niguez',
    name: 'Saúl Ñíguez',
    enrollment: '20210048',
    avatarUrl: '/profile-avatar.svg',
    status: 'present',
  },
  {
    id: 'ferran-torres',
    name: 'Ferran Torres',
    enrollment: '20210050',
    avatarUrl: '/profile-avatar.svg',
    status: 'late',
  },
  {
    id: 'pedro-porro',
    name: 'Pedro Porro',
    enrollment: '20210051',
    avatarUrl: '/profile-avatar.svg',
    status: 'late',
  },
  {
    id: 'ansu-fati',
    name: 'Ansu Fati',
    enrollment: '20210052',
    avatarUrl: '/profile-avatar.svg',
    status: 'late',
  },
  {
    id: 'eric-garcia',
    name: 'Eric García',
    enrollment: '20210053',
    avatarUrl: '/profile-avatar.svg',
    status: 'absent',
  },
  {
    id: 'pau-torres',
    name: 'Pau Torres',
    enrollment: '20210054',
    avatarUrl: '/profile-avatar.svg',
    status: 'late',
  },
  {
    id: 'dani-olmo',
    name: 'Dani Olmo',
    enrollment: '20210055',
    avatarUrl: '/profile-avatar.svg',
    status: 'present',
  },
];

export const TEACHER_INCIDENTS: TeacherIncidentMock[] = [
  {
    id: '2026-0320',
    type: 'Fuego',
    title: 'Fuego',
    date: '10 de mayo, 2020',
    location: 'Laboratorio de Ciencias A',
    reporter: 'Prof. Mendoza',
    priority: 'CRÍTICO',
    tone: 'danger',
    icon: 'fa-solid fa-fire-flame-curved',
  },
  {
    id: '2026-0321',
    type: 'Accidente Médico',
    title: 'Accidente Médico',
    date: '12 de mayo, 2020',
    location: 'Cafetería Principal',
    reporter: 'Ana García',
    priority: 'URGENTE',
    tone: 'danger',
    icon: 'fa-solid fa-briefcase-medical',
  },
  {
    id: '2026-0322',
    type: 'Falla de Infraestructura',
    title: 'Falla de Infraestructura',
    date: '15 de mayo, 2020',
    location: 'Pasillo B-12',
    reporter: 'Seguridad Turno Matutino',
    priority: 'BAJO',
    tone: 'neutral',
    icon: 'fa-solid fa-screwdriver-wrench',
  },
];

export const TEACHER_STUDENT_ATTENDANCE_HISTORY: TeacherAttendanceHistoryMock[] = [
  {
    id: 'hist-24-oct',
    date: '24 Oct, 2023',
    subject: 'Matemáticas Avanzadas',
    time: '08:00 AM',
    status: 'A tiempo',
    statusTone: 'present',
  },
  {
    id: 'hist-23-oct',
    date: '23 Oct, 2023',
    subject: 'Química General',
    time: '10:30 AM',
    status: 'Inasistencia',
    statusTone: 'absent',
  },
  {
    id: 'hist-20-oct',
    date: '20 Oct, 2023',
    subject: 'Historia del Arte',
    time: '09:15 AM',
    status: 'Retardo',
    statusTone: 'late',
  },
  {
    id: 'hist-19-oct',
    date: '19 Oct, 2023',
    subject: 'Matemáticas Avanzadas',
    time: '08:00 AM',
    status: 'A tiempo',
    statusTone: 'present',
  },
  {
    id: 'hist-18-oct',
    date: '18 Oct, 2023',
    subject: 'Literatura Contemporánea',
    time: '12:00 PM',
    status: 'A tiempo',
    statusTone: 'present',
  },
];

export const TEACHER_STUDENT_JUSTIFICATIONS: TeacherJustificationHistoryMock[] = [
  {
    id: 'just-20-sep',
    date: '20 Sep, 2023',
    type: 'Médico',
    typeTone: 'info',
    subject: 'Matemáticas Avanzadas',
    evidenceIcon: 'fa-regular fa-file-lines',
  },
  {
    id: 'just-15-ago',
    date: '15 Ago, 2023',
    type: 'Deportivo',
    typeTone: 'present',
    subject: 'Física II',
    evidenceIcon: 'fa-regular fa-image',
  },
  {
    id: 'just-02-may',
    date: '02 May, 2023',
    type: 'Familiar',
    typeTone: 'warning',
    subject: 'Química General',
    evidenceIcon: 'fa-regular fa-file-lines',
  },
];

export const TEACHER_STUDENT_PROFILE = {
  id: 'juan-ramirez',
  name: 'Juan Ramirez',
  fullName: 'Alejandro García López',
  enrollment: '2021004523',
  email: 'j.ramirez@checkmate.edu.mx',
  group: 'Grupo 1-A',
  department: 'Departamento TICS',
  tutor: 'Dr. Eduardo Mendez',
  avatarUrl: '/profile-avatar.svg',
  attendance: 94,
  justifications: '02',
  emergencyContact: 'Maria Ramirez (Madre)',
  emergencyPhone: '+52 (555) 123-4567',
} as const;

export const TEACHER_EMERGENCY_STUDENTS = [
  { id: 'juan-perez', name: 'Juan Perez', enrollment: '2024001', status: 'PRESENTE' },
  { id: 'saul-garcia', name: 'Saul Garcia', enrollment: '2024042', status: '' },
  { id: 'cesar-lopez', name: 'Cesar Lopez', enrollment: '2024089', status: '' },
  { id: 'rodrigo-martinez', name: 'Rodrigo Martinez', enrollment: '2024102', status: '' },
] as const;
