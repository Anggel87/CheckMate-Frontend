export type ManagementView =
  | 'groups'
  | 'students'
  | 'student-detail'
  | 'student-attendance'
  | 'student-justifications'
  | 'teachers'
  | 'teacher-detail'
  | 'teacher-attendance'
  | 'subjects'
  | 'schedules'
  | 'attendance'
  | 'justifications'
  | 'devices'
  | 'device-edit'
  | 'incidents'
  | 'incident-new'
  | 'incident-detail'
  | 'incident-attendance'
  | 'claims'
  | 'claim-detail'
  | 'statistics'
  | 'audit'
  | 'audit-list';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface ManagementStatus {
  label: string;
  tone: StatusTone;
}

export interface ManagementGroup {
  id: string;
  label: string;
  career: string;
  shift: string;
  studentCount: number;
  attendanceRate: number;
  tutor: string;
}

export interface ManagementAttendanceRecord {
  id: string;
  date: string;
  subject: string;
  time: string;
  classroom: string;
  status: ManagementStatus;
}

export interface ManagementJustification {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  reason: string;
  date: string;
  submittedAt: string;
  status: ManagementStatus;
}

export interface ManagementStudent {
  id: string;
  controlNumber: string;
  name: string;
  group: string;
  career: string;
  email: string;
  phone: string;
  tutorName: string;
  status: ManagementStatus;
  attendanceRate: number;
  level: string;
  avatarUrl: string;
  recentAttendance: ManagementAttendanceRecord[];
}

export interface ManagementTeacher {
  id: string;
  name: string;
  employeeNumber: string;
  email: string;
  phone: string;
  career: string;
  activeGroups: string[];
  subjects: string[];
  status: ManagementStatus;
  schedulesCount: number;
  avatarUrl: string;
}

export interface ManagementSubject {
  id: string;
  name: string;
  group: string;
  semester: string;
  teacher: string;
  schedule: string;
  classroom: string;
}

export interface ManagementSchedule {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  group: string;
  classroom: string;
}

export interface ManagementDevice {
  id: string;
  name: string;
  macAddress: string;
  ipAddress: string;
  classroom: string;
  building: string;
  tutor: string;
  status: ManagementStatus;
  lastSync: string;
}

export interface ManagementIncidentRosterItem {
  studentId: string;
  name: string;
  controlNumber: string;
  status: 'PRESENTE' | 'AUSENTE' | 'DESCONOCIDO';
}

export interface ManagementIncidentHistoryItem {
  id: string;
  date: string;
  description: string;
  actor: string;
}

export interface ManagementIncident {
  id: string;
  title: string;
  type: string;
  severity: ManagementStatus;
  status: ManagementStatus;
  location: string;
  reportedBy: string;
  date: string;
  description: string;
  evidenceUrl: string;
  roster: ManagementIncidentRosterItem[];
  history: ManagementIncidentHistoryItem[];
}

export interface ManagementClaim {
  id: string;
  studentId: string;
  studentName: string;
  group: string;
  subject: string;
  status: ManagementStatus;
  date: string;
  description: string;
  evidenceUrl: string;
  history: ManagementIncidentHistoryItem[];
}

export interface ManagementAuditLog {
  id: string;
  entity: 'students' | 'teachers' | 'groups' | 'devices';
  date: string;
  description: string;
  level: ManagementStatus;
  performedBy: string;
}

export interface ManagementCharts {
  totalStudents: number;
  attendanceRate: number;
  incidentsTotal: number;
  absencesTotal: number;
  justifications: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

export interface ManagementSnapshot {
  groups: ManagementGroup[];
  students: ManagementStudent[];
  teachers: ManagementTeacher[];
  subjects: ManagementSubject[];
  schedules: ManagementSchedule[];
  justifications: ManagementJustification[];
  devices: ManagementDevice[];
  incidents: ManagementIncident[];
  claims: ManagementClaim[];
  logs: ManagementAuditLog[];
  charts: ManagementCharts;
}

export interface IncidentCreatePayload {
  title: string;
  description: string;
  type: string;
  severity: string;
  location: string;
  scheduleId: string;
  studentIds: string[];
  evidence: File | null;
}

export const EMPTY_MANAGEMENT_SNAPSHOT: ManagementSnapshot = {
  groups: [],
  students: [],
  teachers: [],
  subjects: [],
  schedules: [],
  justifications: [],
  devices: [],
  incidents: [],
  claims: [],
  logs: [],
  charts: {
    totalStudents: 0,
    attendanceRate: 0,
    incidentsTotal: 0,
    absencesTotal: 0,
    justifications: {
      approved: 0,
      pending: 0,
      rejected: 0,
    },
  },
};
