export type TutorBadgeTone =
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

export type TutorRequestStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En proceso';
export type TutorAttendanceStatus = 'A tiempo' | 'Inasistencia' | 'Retardo' | 'Justificado';

export interface TutorGroup {
  id: string;
  label: string;
  department: string;
  subject: string;
  enrolled: number;
  attendanceRate: number;
}

export interface TutorStudent {
  id: string;
  name: string;
  initials: string;
  enrollment: string;
  email: string;
  group: string;
  department: string;
  level: string;
  attendanceRate: number;
  absenceCount: number;
  lateCount: number;
  justificationCount: number;
  claimCount: number;
  status: string;
  statusTone: TutorBadgeTone;
  avatarUrl?: string;
  emergencyContact: string;
  emergencyPhone: string;
  tutor: string;
}

export interface TutorAttendanceRecord {
  id: string;
  studentId: string;
  subject: string;
  date: string;
  time: string;
  classroom: string;
  status: TutorAttendanceStatus;
  statusTone: TutorBadgeTone;
  source: string;
  observation: string;
}

export interface TutorJustification {
  id: string;
  studentId: string;
  studentName: string;
  group: string;
  title: string;
  subject: string;
  teacher: string;
  absenceDate: string;
  sentDate: string;
  type: string;
  reason: string;
  detail: string;
  status: TutorRequestStatus;
  statusTone: TutorBadgeTone;
  attachments: TutorAttachment[];
  observations: TutorObservation[];
}

export interface TutorClaim {
  id: string;
  studentId: string;
  studentName: string;
  group: string;
  title: string;
  location: string;
  incidentDate: string;
  reportedAt: string;
  status: TutorRequestStatus;
  statusTone: TutorBadgeTone;
  priority: string;
  description: string;
  evidenceLabel: string;
  timeline: TutorTimelineItem[];
}

export interface TutorAttachment {
  name: string;
  size: string;
  icon: string;
}

export interface TutorObservation {
  author: string;
  role: string;
  date: string;
  message: string;
}

export interface TutorTimelineItem {
  title: string;
  description: string;
  date: string;
}

export interface TutorJustificationFormValue {
  studentId: string;
  attendanceRecordId: string;
  type: string;
  reason: string;
}
