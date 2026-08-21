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
  | 'subject-create'
  | 'subject-edit'
  | 'schedules'
  | 'schedule-create'
  | 'schedule-edit'
  | 'school-years'
  | 'school-year-create'
  | 'school-year-edit'
  | 'careers'
  | 'career-create'
  | 'career-edit'
  | 'attendance-settings'
  | 'attendance-setting-create'
  | 'attendance-setting-edit'
  | 'classrooms'
  | 'classroom-create'
  | 'classroom-edit'
  | 'attendance'
  | 'justifications'
  | 'devices'
  | 'device-create'
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

export interface ManagementActionResult {
  success: boolean;
  message: string | null;
}

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
  schoolYearId: string;
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

export interface ManagementTutor {
  id: string;
  fullName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface ManagementStudent {
  id: string;
  controlNumber: string;
  name: string;
  group: string;
  career: string;
  email: string;
  phone: string;
  address: string;
  tutorName: string;
  tutors: ManagementTutor[];
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

export interface SubjectCareerSummary {
  id: string;
  name: string;
  shortName: string;
}

export interface ManagementSubject {
  id: string;
  name: string;
  group: string;
  semester: string;
  teacher: string;
  schedule: string;
  classroom: string;
  code: string;
  description: string;
  isActive: boolean;
  schedulesCount: number;
  careers: SubjectCareerSummary[];
}

export interface SubjectFormPayload {
  name: string;
  code: string;
  description?: string;
  careerIds?: string[];
}

export interface ManagementSchedule {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  group: string;
  classroom: string;
  schoolYearId: string;
  groupId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleFormPayload {
  schoolYearId: string;
  groupId: string;
  subjectId: string;
  teacherId: string;
  classroomId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface ManagementSchoolYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  groupsCount: number;
}

export interface SchoolYearFormPayload {
  name: string;
  startDate: string;
  endDate: string;
  status?: string;
}

export interface ManagementCareer {
  id: string;
  name: string;
  shortName: string;
  code: string;
  isActive: boolean;
  directorId: string;
  directorName: string;
  groupsCount: number;
}

export interface CareerFormPayload {
  name: string;
  shortName?: string;
  code: string;
  directorId: string;
}

export interface ManagementCareerDirector {
  id: string;
  fullName: string;
}

export interface ManagementAttendanceSetting {
  id: string;
  scheduleId: string;
  scheduleLabel: string;
  presentToleranceMinutes: number;
  lateToleranceMinutes: number;
  allowManualAttendance: boolean;
  isActive: boolean;
}

export interface AttendanceSettingFormPayload {
  scheduleId: string;
  presentToleranceMinutes: number;
  lateToleranceMinutes: number;
  allowManualAttendance: boolean;
}

export interface ManagementDevice {
  id: string;
  name: string;
  macAddress: string;
  ipAddress: string;
  classroom: string;
  classroomId: string;
  building: string;
  tutor: string;
  status: ManagementStatus;
  lastSync: string;
}

export interface ManagementClassroom {
  id: string;
  name: string;
  building: string;
}

export interface ClassroomFormPayload {
  name: string;
  building: string;
}

export interface DeviceCreatePayload {
  macAddress: string;
  ipAddress: string;
  classroomId: string;
}

export type IncidentRosterStatus = 'DESCONOCIDO' | 'PRESENTE' | 'EXTRAVIADO' | 'AUSENTE' | 'SEGURO';

export interface ManagementIncidentRosterItem {
  studentId: string;
  name: string;
  controlNumber: string;
  status: IncidentRosterStatus;
  notes: string;
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
  groups: string[];
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
