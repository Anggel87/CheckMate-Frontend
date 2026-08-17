import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import {
  formatApiDate,
  readFullName,
  readId,
  readString,
  toRecord,
  toneFromRequestStatus,
} from '../../../core/api/api-adapter';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import {
  TeacherAttendanceHistoryView,
  TeacherGroupView,
  TeacherJustificationHistoryView,
  TeacherPortalApiService,
  TeacherStudentTutorPayload,
  TeacherStudentView,
} from '../../teacher-portal/data-access/teacher-portal-api.service';
import {
  TutorAttendanceRecord,
  TutorAttendanceStatus,
  TutorBadgeTone,
  TutorClaim,
  TutorGroup,
  TutorJustification,
  TutorLegalGuardian,
  TutorRequestStatus,
  TutorStudent,
} from '../models/tutoring.model';

const EMPTY_TUTOR_STUDENT: TutorStudent = {
  id: '',
  name: '',
  initials: '',
  enrollment: '',
  email: '',
  group: '',
  groupId: '',
  department: '',
  level: '',
  attendanceRate: 0,
  absenceCount: 0,
  lateCount: 0,
  justificationCount: 0,
  claimCount: 0,
  todayPresentCount: 0,
  todayAbsentCount: 0,
  weeklyAbsenceCount: 0,
  status: 'Sin datos',
  statusTone: 'neutral',
  tutors: [],
};

const EMPTY_TUTOR_RECORD: TutorAttendanceRecord = {
  id: '',
  studentId: '',
  subject: '',
  date: '',
  rawDate: '',
  time: '',
  status: 'Inasistencia',
  statusTone: 'neutral',
  source: 'Sistema',
  observation: 'No se encontro el registro solicitado.',
};

const EMPTY_TUTOR_JUSTIFICATION: TutorJustification = {
  id: '',
  studentId: '',
  studentName: '',
  group: '',
  title: '',
  subject: '',
  teacher: '',
  absenceDate: '',
  sentDate: '',
  type: '',
  reason: '',
  detail: 'No se encontro el justificante solicitado.',
  status: 'Pendiente',
  statusTone: 'neutral',
  attachments: [],
  observations: [],
};

const EMPTY_TUTOR_CLAIM: TutorClaim = {
  id: '',
  studentId: '',
  studentName: '',
  group: '',
  title: '',
  location: '',
  incidentDate: '',
  reportedAt: '',
  status: 'Pendiente',
  statusTone: 'neutral',
  priority: '',
  description: 'No se encontro el reclamo solicitado.',
  evidenceLabel: '',
  timeline: [],
};

@Injectable({
  providedIn: 'root',
})
export class TutoringDataService {
  private readonly api = inject(CheckmateApiService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  private readonly groupState = signal<TutorGroup[]>([]);
  private readonly studentState = signal<TutorStudent[]>([]);
  private readonly attendanceState = signal<TutorAttendanceRecord[]>([]);
  private readonly justificationState = signal<TutorJustification[]>([]);
  private readonly claimState = signal<TutorClaim[]>([]);

  readonly students = this.studentState.asReadonly();
  readonly groups = this.groupState.asReadonly();
  readonly attendanceRecords = this.attendanceState.asReadonly();
  readonly justifications = this.justificationState.asReadonly();
  readonly claims = this.claimState.asReadonly();

  readonly pendingJustifications = computed(
    () => this.justificationState().filter((item) => item.status === 'Pendiente').length,
  );
  readonly activeClaims = computed(
    () => this.claimState().filter((item) => item.status !== 'Aprobado').length,
  );

  readonly todayAttendanceSummary = computed(() => {
    const students = this.students();
    const present = students.reduce((sum, student) => sum + student.todayPresentCount, 0);
    const absent = students.reduce((sum, student) => sum + student.todayAbsentCount, 0);
    const total = present + absent;

    return {
      present,
      absent,
      rate: total ? Math.round((present / total) * 100) : 0,
    };
  });

  readonly weeklyAbsenceAlerts = computed(() =>
    this.students()
      .filter((student) => student.weeklyAbsenceCount >= 3)
      .map((student) => ({ student, count: student.weeklyAbsenceCount })),
  );

  constructor() {
    this.loadGroupsAndStudents();
    this.loadClaims();
  }

  studentById(studentId: string | null): TutorStudent {
    return this.students().find((student) => student.id === studentId) ?? EMPTY_TUTOR_STUDENT;
  }

  attendanceForStudent(studentId: string): TutorAttendanceRecord[] {
    return this.attendanceRecords().filter((record) => record.studentId === studentId);
  }

  attendanceById(recordId: string | null): TutorAttendanceRecord | undefined {
    return this.attendanceRecords().find((record) => record.id === recordId);
  }

  justificationById(justificationId: string | null): TutorJustification {
    return (
      this.justificationState().find((item) => item.id === justificationId) ??
      EMPTY_TUTOR_JUSTIFICATION
    );
  }

  claimById(claimId: string | null): TutorClaim {
    return this.claimState().find((item) => item.id === claimId) ?? EMPTY_TUTOR_CLAIM;
  }

  updateJustificationStatus(
    id: string,
    status: Extract<TutorRequestStatus, 'Aprobado' | 'Rechazado'>,
    comment = '',
  ): Observable<boolean> {
    const current = this.justificationById(id);

    if (!current.id || !current.studentId) {
      return of(false);
    }

    return this.api
      .patch<unknown>(`/tutor/students/${current.studentId}/justifications/${id}`, {
        status: status === 'Aprobado' ? 'ACEPTADO' : 'RECHAZADO',
        comment,
      })
      .pipe(
        tap(() => {
          this.justificationState.update((items) =>
            items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    statusTone: status === 'Aprobado' ? 'success' : 'danger',
                  }
                : item,
            ),
          );
        }),
        map(() => true),
      );
  }

  createJustification(
    studentId: string,
    attendanceId: string,
    reason: string,
    evidence: File | null,
  ): Observable<boolean> {
    const formData = new FormData();
    formData.set('attendance_id', attendanceId);
    formData.set('reason', reason);

    if (evidence) {
      formData.set('evidence', evidence);
    }

    return this.api.post<unknown>(`/tutor/students/${studentId}/justifications`, formData).pipe(
      tap(() => {
        this.loadStudentAttendance(studentId);
        this.loadStudentJustifications(studentId);
      }),
      map(() => true),
    );
  }

  createTutor(studentId: string, payload: TeacherStudentTutorPayload): Observable<boolean> {
    return this.teacherApi.addStudentTutor(studentId, payload).pipe(
      tap((profile) => {
        this.studentState.update((students) =>
          students.map((student) =>
            student.id === studentId ? { ...student, tutors: profile.tutors.map((item) => this.toLegalGuardian(item)) } : student,
          ),
        );
      }),
      map(() => true),
    );
  }

  notifyTutors(studentId: string, title: string, message: string): Observable<number> {
    return this.teacherApi
      .notifyStudentTutors(studentId, title, message)
      .pipe(map((result) => result.recipientsCount));
  }

  updateClaimStatus(id: string, status: TutorRequestStatus, comment = ''): Observable<boolean> {
    if (!id) {
      return of(false);
    }

    return this.api
      .patch<unknown>(`/tutor/claims/${id}/action`, {
        action: this.toApiClaimAction(status),
        comment,
      })
      .pipe(
        tap(() => {
          this.claimState.update((items) =>
            items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status,
                    statusTone: this.statusTone(status),
                  }
                : item,
            ),
          );
        }),
        map(() => true),
      );
  }

  private loadGroupsAndStudents(): void {
    this.teacherApi
      .getGroups()
      .pipe(catchError(() => of([])))
      .subscribe((groups) => {
        this.groupState.set(groups.map((group) => this.toTutorGroup(group)));

        if (!groups.length) {
          this.studentState.set([]);
          this.attendanceState.set([]);
          this.justificationState.set([]);
          return;
        }

        forkJoin(
          groups.map((group) =>
            this.teacherApi.getGroupStudents(group.id).pipe(
              map((students) => students.map((student) => this.toTutorStudent(student, group))),
              catchError(() => of([])),
            ),
          ),
        ).subscribe((studentGroups) => {
          this.studentState.set(studentGroups.flat());
        });
      });
  }

  /**
   * Attendance/justification counts for the list and dashboard come pre-aggregated from
   * the groups/students endpoint. Full per-record history is only needed once a specific
   * student's attendance, calendar or justifications view is opened, so it's fetched lazily
   * here instead of upfront for every tutored student.
   */
  loadStudentAttendance(studentId: string): void {
    this.teacherApi
      .getStudentAttendance(studentId)
      .pipe(
        map((records) => records.map((record) => this.toTutorAttendance(record, studentId))),
        catchError(() => of([] as TutorAttendanceRecord[])),
      )
      .subscribe((records) => {
        this.attendanceState.update((current) => [
          ...current.filter((record) => record.studentId !== studentId),
          ...records,
        ]);
      });
  }

  loadStudentJustifications(studentId: string): void {
    const student = this.studentById(studentId);

    this.teacherApi
      .getStudentJustifications(studentId)
      .pipe(
        map((items) => items.map((item) => this.toTutorJustification(item, student))),
        catchError(() => of([] as TutorJustification[])),
      )
      .subscribe((justifications) => {
        this.justificationState.update((current) => [
          ...current.filter((item) => item.studentId !== studentId),
          ...justifications,
        ]);
      });
  }

  loadStudentTutors(studentId: string): void {
    this.teacherApi
      .getStudentProfile(studentId)
      .pipe(
        map((profile) => profile.tutors.map((item) => this.toLegalGuardian(item))),
        catchError(() => of([] as TutorLegalGuardian[])),
      )
      .subscribe((tutors) => {
        this.studentState.update((current) =>
          current.map((student) => (student.id === studentId ? { ...student, tutors } : student)),
        );
      });
  }

  private loadClaims(): void {
    this.api
      .getCollection('/tutor/claims', (item) => this.toTutorClaim(item))
      .pipe(catchError(() => of([])))
      .subscribe((claims) => {
        this.claimState.set(claims);
        this.applyClaimCounts(claims);
      });
  }

  private toTutorGroup(group: TeacherGroupView): TutorGroup {
    return {
      id: group.id,
      label: group.group,
      department: group.career,
      subject: group.subject,
      enrolled: group.students,
      attendanceRate: 0,
    };
  }

  private toTutorStudent(student: TeacherStudentView, group: TeacherGroupView): TutorStudent {
    return {
      id: student.id,
      name: student.name,
      initials: this.initials(student.name),
      enrollment: student.enrollment,
      email: student.email,
      group: student.group || group.group,
      groupId: group.id,
      department: group.career,
      level: group.subject,
      attendanceRate: student.attendance,
      absenceCount: student.absenceCount,
      lateCount: student.lateCount,
      justificationCount: student.justificationCount,
      claimCount: 0,
      todayPresentCount: student.todayPresentCount,
      todayAbsentCount: student.todayAbsentCount,
      weeklyAbsenceCount: student.weeklyAbsenceCount,
      status: student.status,
      statusTone: student.statusTone,
      avatarUrl: student.avatarUrl,
      tutors: [],
    };
  }

  private toLegalGuardian(item: { id: string; fullName: string; phone: string; relationship: string; isPrimary: boolean }): TutorLegalGuardian {
    return {
      id: item.id,
      fullName: item.fullName,
      phone: item.phone,
      relationship: item.relationship,
      isPrimary: item.isPrimary,
    };
  }

  private toTutorAttendance(
    record: TeacherAttendanceHistoryView,
    studentId: string,
  ): TutorAttendanceRecord {
    return {
      id: record.id,
      studentId,
      subject: record.subject,
      date: record.date,
      rawDate: record.rawDate,
      time: record.time,
      status: this.toTutorAttendanceStatus(record.status),
      statusTone: record.statusTone,
      source: 'Sistema',
      observation: 'Registro de asistencia.',
    };
  }

  private toTutorJustification(
    item: TeacherJustificationHistoryView,
    student: TutorStudent,
  ): TutorJustification {
    const status = this.toTutorStatus(item.type);

    return {
      id: item.id,
      studentId: student.id,
      studentName: student.name,
      group: student.group,
      title: item.subject,
      subject: item.subject,
      teacher: '',
      absenceDate: item.date,
      sentDate: item.date,
      type: item.type,
      reason: item.type,
      detail: 'Justificante registrado.',
      status,
      statusTone: this.statusTone(status),
      attachments: [],
      observations: [],
    };
  }

  private toTutorClaim(value: unknown): TutorClaim {
    const record = toRecord(value);
    const student = toRecord(record?.['student']);
    const group = toRecord(record?.['group']);
    const career = toRecord(record?.['career']);
    const subject = toRecord(record?.['subject']);
    const status = this.toTutorStatus(readString(record, 'status'));
    const evidenceUrl = readString(record, 'evidence_url');

    return {
      id: readId(record),
      studentId: readId(student),
      studentName: readFullName(student),
      group: this.groupLabel(group),
      title: readString(subject, 'name', 'Reclamo'),
      location: readString(career, 'short_name') || readString(career, 'name'),
      incidentDate: formatApiDate(readString(record, 'created_at')),
      reportedAt: formatApiDate(readString(record, 'created_at')),
      status,
      statusTone: this.statusTone(status),
      priority: readString(record, 'status'),
      description: readString(record, 'description'),
      evidenceLabel: evidenceUrl || 'Sin evidencia adjunta',
      timeline: [],
    };
  }

  private applyClaimCounts(claims: readonly TutorClaim[]): void {
    this.studentState.update((students) =>
      students.map((student) => ({
        ...student,
        claimCount: claims.filter((item) => item.studentId === student.id).length,
      })),
    );
  }

  private toApiClaimAction(status: TutorRequestStatus): string {
    if (status === 'Aprobado') {
      return 'ACEPTADO';
    }

    if (status === 'Rechazado') {
      return 'RECHAZADO';
    }

    if (status === 'En proceso') {
      return 'EN_PROCESO';
    }

    return 'EN_PROCESO';
  }

  private toTutorAttendanceStatus(status: string): TutorAttendanceStatus {
    if (status === 'Retardo') {
      return 'Retardo';
    }

    if (status === 'Justificado') {
      return 'Justificado';
    }

    if (status === 'Inasistencia' || status === 'Falta') {
      return 'Inasistencia';
    }

    return 'A tiempo';
  }

  private toTutorStatus(status: string): TutorRequestStatus {
    const normalized = status.toUpperCase();

    if (normalized.includes('ACEPT') || normalized.includes('APROB')) {
      return 'Aprobado';
    }

    if (normalized.includes('RECHAZ')) {
      return 'Rechazado';
    }

    if (normalized.includes('PROCES') || normalized.includes('CONTACT')) {
      return 'En proceso';
    }

    return 'Pendiente';
  }

  private statusTone(status: TutorRequestStatus): TutorBadgeTone {
    const tone = toneFromRequestStatus(status);
    return tone === 'success' || tone === 'danger' || tone === 'info' || tone === 'pending'
      ? tone
      : 'neutral';
  }

  private groupLabel(record: Record<string, unknown> | null | undefined): string {
    const label = readString(record, 'label');

    if (label) {
      return label;
    }

    const grade = readString(record, 'grade');
    const section = readString(record, 'section');
    return [grade, section].filter(Boolean).join('-');
  }

  private initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}

export function emptyTutorAttendanceRecord(): TutorAttendanceRecord {
  return EMPTY_TUTOR_RECORD;
}
