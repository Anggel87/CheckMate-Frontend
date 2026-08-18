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

export interface TutorLegalGuardian {
  id: string;
  fullName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface TutorStudent {
  id: string;
  name: string;
  initials: string;
  enrollment: string;
  email: string;
  group: string;
  groupId: string;
  department: string;
  level: string;
  attendanceRate: number;
  absenceCount: number;
  lateCount: number;
  justificationCount: number;
  claimCount: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  weeklyAbsenceCount: number;
  status: string;
  statusTone: TutorBadgeTone;
  avatarUrl?: string;
  tutors: TutorLegalGuardian[];
}

export interface TutorAttendanceRecord {
  id: string;
  studentId: string;
  subject: string;
  date: string;
  rawDate: string;
  time: string;
  classTimeRange: string;
  checkInDelayLabel: string;
  status: TutorAttendanceStatus;
  statusTone: TutorBadgeTone;
  source: string;
  observation: string;
}

export interface TutorJustificationReview {
  by: string;
  at: string;
  comment: string;
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
  evidenceUrl: string;
  review: TutorJustificationReview | null;
}

export interface TutorClaimLastAction {
  by: string;
  at: string;
  comment: string;
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
  description: string;
  evidenceUrl: string;
  lastAction: TutorClaimLastAction | null;
}



export interface TutorJustificationFormValue {
  studentId: string;
  attendanceRecordId: string;
  type: string;
  reason: string;
}
