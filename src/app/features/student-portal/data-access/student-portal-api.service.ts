import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import {
  UnknownRecord,
  formatApiDate,
  formatApiTime,
  initialsFromName,
  readFirstString,
  readFullName,
  readId,
  readNumber,
  readString,
  toRecord,
  toneFromAttendanceStatus,
  toneFromRequestStatus,
  unwrapData,
} from '../../../core/api/api-adapter';
import { StatusBadgeTone } from '../../../shared/components/status-badge/status-badge.component';

export type StudentMetricTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type StudentAttendanceTone = 'present' | 'late' | 'absent' | 'justified';

export interface StudentProfileView {
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

export interface StudentMetricView {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: StudentMetricTone;
  trend?: string;
}

export interface StudentCourseView {
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

export interface StudentAttendanceRecordView {
  id: string;
  subjectId: string;
  date: string;
  rawDate: string;
  subject: string;
  teacher: string;
  status: string;
  statusTone: StatusBadgeTone;
  time: string;
  location?: string;
  justified?: boolean;
  justifiable?: boolean;
}

export interface StudentJustificationView {
  id: string;
  title: string;
  description: string;
  date: string;
  status: string;
  statusTone: StatusBadgeTone;
  attachments: number;
}

export interface StudentClaimView {
  id: string;
  date: string;
  title: string;
  description: string;
  status: string;
  statusTone: StatusBadgeTone;
}

export interface StudentAbsenceView {
  id: string;
  subjectId: string;
  attendanceId: string;
  subject: string;
  teacher: string;
  time: string;
}

export interface StudentAbsenceGroupView {
  date: string;
  absences: StudentAbsenceView[];
}

export interface StudentCalendarDayView {
  day: string;
  muted?: boolean;
  selected?: boolean;
  tone?: StudentAttendanceTone;
}

export interface StudentAttendanceOverviewView {
  metrics: StudentMetricView[];
  calendarWeeks: StudentCalendarDayView[][];
  recentRecords: StudentAttendanceRecordView[];
  monthLabel: string;
}

export interface StudentDashboardView {
  profile: StudentProfileView;
  metrics: StudentMetricView[];
  currentCourse: StudentCourseView | null;
  quickActions: readonly StudentQuickAction[];
}

export interface StudentQuickAction {
  label: string;
  description: string;
  icon: string;
  route: string;
}

export interface StudentAttendanceDetailView {
  subject: string;
  teacher: string;
  status: string;
  statusTone: StatusBadgeTone;
  date: string;
  scheduledTime: string;
  registeredTime: string;
  classroom: string;
  observations: string;
}

const STUDENT_QUICK_ACTIONS: readonly StudentQuickAction[] = [
  {
    label: 'Nuevo Reclamo',
    description: 'Reportar incidencia',
    icon: 'fa-solid fa-triangle-exclamation',
    route: '/student/claims/new',
  },
  {
    label: 'Crear Justificante',
    description: 'Subir evidencia',
    icon: 'fa-regular fa-file-lines',
    route: '/student/justifications/select-absence',
  },
];

export const EMPTY_STUDENT_PROFILE: StudentProfileView = {
  name: '',
  role: 'Alumno',
  enrollment: '',
  groupCareer: '',
  email: '',
  phone: '',
  guardian: '',
  address: '',
  avatarUrl: '/profile-avatar.svg',
  attendanceTotal: 0,
};

export const EMPTY_STUDENT_ATTENDANCE_DETAIL: StudentAttendanceDetailView = {
  subject: '',
  teacher: '',
  status: '',
  statusTone: 'neutral',
  date: '',
  scheduledTime: '',
  registeredTime: '',
  classroom: '',
  observations: 'No se encontro el registro solicitado en la API.',
};

@Injectable({
  providedIn: 'root',
})
export class StudentPortalApiService {
  private readonly api = inject(CheckmateApiService);

  getProfile(): Observable<StudentProfileView> {
    return this.api.get<unknown>('/alumno/profile').pipe(
      map((response) => this.toProfile(unwrapData(response))),
    );
  }

  getDashboard(): Observable<StudentDashboardView> {
    return forkJoin({
      profile: this.getProfile().pipe(catchError(() => of(EMPTY_STUDENT_PROFILE))),
      subjects: this.getSubjects().pipe(catchError(() => of([]))),
      records: this.getAttendanceRecords().pipe(catchError(() => of([]))),
      justifications: this.getJustifications().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ profile, subjects, records, justifications }) => {
        const metrics = this.buildMetrics(records, justifications);
        const currentCourse = subjects[0] ?? null;
        return {
          profile: { ...profile, attendanceTotal: this.attendanceRate(records) },
          metrics: metrics.slice(0, 3),
          currentCourse,
          quickActions: STUDENT_QUICK_ACTIONS,
        };
      }),
    );
  }

  getAttendanceOverview(): Observable<StudentAttendanceOverviewView> {
    return forkJoin({
      records: this.getAttendanceRecords().pipe(catchError(() => of([]))),
      justifications: this.getJustifications().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ records, justifications }) => ({
        metrics: this.buildMetrics(records, justifications),
        calendarWeeks: this.buildCalendar(records),
        recentRecords: records.slice(0, 4),
        monthLabel: this.currentMonthLabel(),
      })),
    );
  }

  getSubjects(): Observable<StudentCourseView[]> {
    return this.api
      .getCollection('/alumno/subjects', (item) => this.toSubject(item))
      .pipe(
        switchMap((subjects) => {
          if (!subjects.length) {
            return of([]);
          }

          return forkJoin(
            subjects.map((subject) =>
              this.getSubject(subject.id).pipe(catchError(() => of(subject))),
            ),
          );
        }),
      );
  }

  getSubject(subjectId: string): Observable<StudentCourseView> {
    return this.api.get<unknown>(`/alumno/subjects/${subjectId}`).pipe(
      map((response) => this.toSubject(unwrapData(response), subjectId)),
    );
  }

  getSubjectDetail(subjectId: string): Observable<{
    subject: StudentCourseView;
    history: StudentAttendanceRecordView[];
  }> {
    return forkJoin({
      subject: this.getSubject(subjectId),
      history: this.getSubjectAttendance(subjectId).pipe(catchError(() => of([]))),
    });
  }

  getAttendanceRecords(): Observable<StudentAttendanceRecordView[]> {
    return this.getSubjects().pipe(
      switchMap((subjects) => {
        if (!subjects.length) {
          return of([]);
        }

        return forkJoin(
          subjects.map((subject) =>
            this.getSubjectAttendance(subject.id, subject).pipe(catchError(() => of([]))),
          ),
        ).pipe(
          map((groups) =>
            groups
              .flat()
              .sort((left, right) => this.sortByRawDateDescending(left.rawDate, right.rawDate)),
          ),
        );
      }),
    );
  }

  getSubjectAttendance(
    subjectId: string,
    subject?: StudentCourseView,
  ): Observable<StudentAttendanceRecordView[]> {
    const subjectInfo$ = subject ? of(subject) : this.getSubject(subjectId).pipe(catchError(() => of(null)));

    return subjectInfo$.pipe(
      switchMap((subjectInfo) =>
        this.api.getCollection(`/alumno/subjects/${subjectId}/attendance`, (item) =>
          this.toAttendanceRecord(item, subjectId, subjectInfo),
        ),
      ),
    );
  }

  getAttendanceDetail(attendanceId: string | null): Observable<StudentAttendanceDetailView> {
    return this.getAttendanceRecords().pipe(
      map((records) => records.find((record) => record.id === attendanceId)),
      map((record) => (record ? this.toAttendanceDetail(record) : EMPTY_STUDENT_ATTENDANCE_DETAIL)),
    );
  }

  getJustifications(): Observable<StudentJustificationView[]> {
    return this.api.getCollection('/alumno/justifications', (item) => this.toJustification(item));
  }

  getClaims(): Observable<StudentClaimView[]> {
    return this.api.getCollection('/alumno/claims', (item) => this.toClaim(item));
  }

  getJustifiableAbsences(): Observable<StudentAbsenceGroupView[]> {
    return this.getAttendanceRecords().pipe(
      map((records) => records.filter((record) => record.justifiable && record.statusTone === 'absent')),
      map((records) => this.groupAbsences(records)),
    );
  }

  createClaim(subjectId: string, description: string, evidence: File | null): Observable<boolean> {
    const formData = new FormData();
    formData.set('subject_id', subjectId);
    formData.set('description', description);

    if (evidence) {
      formData.set('evidence', evidence);
    }

    return this.api.post<unknown>('/alumno/claims', formData).pipe(map(() => true));
  }

  createJustification(
    subjectId: string,
    attendanceId: string,
    reason: string,
    evidence: File,
  ): Observable<boolean> {
    const formData = new FormData();
    formData.set('reason', reason);
    formData.set('evidence', evidence);

    return this.api
      .post<unknown>(`/alumno/subjects/${subjectId}/attendance/${attendanceId}/justify`, formData)
      .pipe(map(() => true));
  }

  private toProfile(value: unknown): StudentProfileView {
    const record = toRecord(value);
    const group = toRecord(record?.['group']);
    const career = toRecord(group?.['career']) ?? toRecord(record?.['career']);
    const tutors = Array.isArray(record?.['tutors']) ? record?.['tutors'] : [];
    const primaryTutor = toRecord(tutors[0]);
    const name = readFullName(record);
    const groupLabel = this.groupLabel(group);
    const careerName = readFirstString(career, ['short_name', 'name']);

    return {
      name,
      role: 'Alumno',
      enrollment: readFirstString(record, ['control_number', 'enrollment', 'matricula', 'student_number']),
      groupCareer: [groupLabel, careerName].filter(Boolean).join(' | '),
      email: readString(record, 'email'),
      phone: readString(record, 'phone'),
      guardian: readFullName(primaryTutor),
      address: readString(record, 'address'),
      avatarUrl: readFirstString(record, ['photo_url', 'avatar_url'], '/profile-avatar.svg'),
      attendanceTotal: readNumber(record, 'attendance_rate', 0),
    };
  }

  private toSubject(value: unknown, fallbackId = ''): StudentCourseView {
    const record = toRecord(value);
    const teacher = toRecord(record?.['teacher']);
    const group = toRecord(record?.['group']);
    const classroom = toRecord(record?.['classroom']);
    const summary = toRecord(record?.['attendance_summary']);
    const presentCount = readNumber(summary, 'on_time', readNumber(summary, 'PRESENTE', 0));
    const lateCount = readNumber(summary, 'late', readNumber(summary, 'RETARDO', 0));
    const absentCount = readNumber(summary, 'absent', readNumber(summary, 'FALTA', 0));
    const attendance = this.attendanceRateFromCounts(presentCount, lateCount, absentCount);

    return {
      id: readId(record, fallbackId),
      name: readString(record, 'name'),
      teacher: readFullName(teacher),
      group: this.groupLabel(group),
      schedule: readString(record, 'schedule'),
      location: readFirstString(classroom, ['name', 'label'], readString(record, 'classroom')),
      attendance,
      icon: 'fa-regular fa-bookmark',
      tone: this.metricTone(attendance),
      presentCount,
      lateCount,
      absentCount,
    };
  }

  private toAttendanceRecord(
    value: unknown,
    subjectId: string,
    subject: StudentCourseView | null,
  ): StudentAttendanceRecordView {
    const record = toRecord(value);
    const rawStatus = readString(record, 'status');
    const statusTone = toneFromAttendanceStatus(rawStatus);
    const rawDate = readFirstString(record, ['date', 'registered_at', 'created_at']);
    const registeredAt = readFirstString(record, ['registered_at', 'scanned_at', 'created_at']);

    return {
      id: readFirstString(record, ['attendance_id', 'id']),
      subjectId,
      date: formatApiDate(rawDate),
      rawDate,
      subject: subject?.name ?? '',
      teacher: subject?.teacher ?? '',
      status: this.attendanceStatusLabel(rawStatus),
      statusTone,
      time: formatApiTime(registeredAt) || subject?.schedule || '',
      location: subject?.location,
      justified: statusTone === 'justified',
      justifiable: readBooleanLike(record, 'justifiable'),
    };
  }

  private toJustification(value: unknown): StudentJustificationView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const status = readString(record, 'status');
    const evidenceUrl = readString(record, 'evidence_url');
    const reason = readFirstString(record, ['reason', 'description', 'type'], 'Justificante');

    return {
      id: readId(record),
      title: readString(subject, 'name', reason),
      description: reason,
      date: formatApiDate(readFirstString(record, ['created_at', 'submitted_at', 'date'])),
      status: this.requestStatusLabel(status),
      statusTone: toneFromRequestStatus(status),
      attachments: evidenceUrl ? 1 : 0,
    };
  }

  private toClaim(value: unknown): StudentClaimView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const teacher = toRecord(record?.['teacher']);
    const status = readString(record, 'status');
    const subjectName = readString(subject, 'name', 'Reclamo');
    const teacherName = readFullName(teacher);

    return {
      id: readId(record),
      date: formatApiDate(readFirstString(record, ['created_at', 'date'])),
      title: subjectName,
      description: readString(record, 'description', teacherName),
      status: this.requestStatusLabel(status),
      statusTone: toneFromRequestStatus(status),
    };
  }

  private toAttendanceDetail(record: StudentAttendanceRecordView): StudentAttendanceDetailView {
    return {
      subject: record.subject,
      teacher: record.teacher,
      status: record.status,
      statusTone: record.statusTone,
      date: record.date,
      scheduledTime: record.time,
      registeredTime: record.statusTone === 'absent' ? '--:--' : record.time,
      classroom: record.location ?? '',
      observations: record.justifiable
        ? 'Este registro puede justificarse con evidencia valida.'
        : 'Registro obtenido desde la API de asistencia.',
    };
  }

  private buildMetrics(
    records: readonly StudentAttendanceRecordView[],
    justifications: readonly StudentJustificationView[],
  ): StudentMetricView[] {
    const absent = records.filter((record) => record.statusTone === 'absent').length;
    const late = records.filter((record) => record.statusTone === 'late').length;
    const approved = justifications.filter((item) => item.statusTone === 'success').length;
    const attendanceRate = this.attendanceRate(records);

    return [
      {
        label: 'Asistencia Total',
        value: `${attendanceRate}%`,
        detail: records.length ? 'Calculada con registros reales' : 'Sin registros',
        icon: 'fa-solid fa-percent',
        tone: this.metricTone(attendanceRate),
      },
      {
        label: 'Faltas',
        value: String(absent),
        detail: 'Registradas en la API',
        icon: 'fa-solid fa-xmark',
        tone: absent > 0 ? 'danger' : 'success',
      },
      {
        label: 'Retardos',
        value: String(late),
        detail: 'Acumulados',
        icon: 'fa-regular fa-clock',
        tone: late > 0 ? 'warning' : 'success',
      },
      {
        label: 'Justificantes',
        value: String(justifications.length),
        detail: `${approved} aprobados`,
        icon: 'fa-regular fa-calendar-check',
        tone: 'info',
      },
    ];
  }

  private groupAbsences(records: readonly StudentAttendanceRecordView[]): StudentAbsenceGroupView[] {
    const groups = new Map<string, StudentAbsenceView[]>();

    records.forEach((record) => {
      const current = groups.get(record.date) ?? [];
      current.push({
        id: record.id,
        subjectId: record.subjectId,
        attendanceId: record.id,
        subject: record.subject,
        teacher: record.teacher,
        time: record.time,
      });
      groups.set(record.date, current);
    });

    return [...groups.entries()].map(([date, absences]) => ({ date, absences }));
  }

  private buildCalendar(records: readonly StudentAttendanceRecordView[]): StudentCalendarDayView[][] {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const statusByDay = new Map<number, StudentAttendanceTone>();

    records.forEach((record) => {
      const parsed = new Date(record.rawDate);

      if (parsed.getFullYear() === year && parsed.getMonth() === month) {
        const tone = this.calendarTone(record.statusTone);

        if (tone) {
          statusByDay.set(parsed.getDate(), tone);
        }
      }
    });

    const days: StudentCalendarDayView[] = [];
    const leadingDays = firstDay.getDay();

    for (let index = 0; index < leadingDays; index += 1) {
      days.push({ day: '', muted: true });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      days.push({
        day: String(day),
        selected: day === today.getDate(),
        tone: statusByDay.get(day),
      });
    }

    while (days.length % 7 !== 0) {
      days.push({ day: '', muted: true });
    }

    const weeks: StudentCalendarDayView[][] = [];
    for (let index = 0; index < days.length; index += 7) {
      weeks.push(days.slice(index, index + 7));
    }

    return weeks;
  }

  private attendanceRate(records: readonly StudentAttendanceRecordView[]): number {
    if (!records.length) {
      return 0;
    }

    const present = records.filter(
      (record) => record.statusTone === 'present' || record.statusTone === 'justified',
    ).length;

    return Math.round((present / records.length) * 100);
  }

  private attendanceRateFromCounts(present: number, late: number, absent: number): number {
    const total = present + late + absent;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  private metricTone(value: number): StudentMetricTone {
    if (value >= 90) {
      return 'success';
    }

    if (value >= 75) {
      return 'warning';
    }

    if (value > 0) {
      return 'danger';
    }

    return 'neutral';
  }

  private groupLabel(group: UnknownRecord | null | undefined): string {
    const label = readString(group, 'label');

    if (label) {
      return label;
    }

    const grade = readString(group, 'grade');
    const section = readString(group, 'section');
    return [grade, section].filter(Boolean).join('-');
  }

  private attendanceStatusLabel(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized.includes('PRESENTE')) {
      return 'Presente';
    }

    if (normalized.includes('RETARDO')) {
      return 'Retardo';
    }

    if (normalized.includes('JUSTIFIC')) {
      return 'Justificado';
    }

    if (normalized.includes('FALTA')) {
      return 'Falta';
    }

    return status || 'Sin estado';
  }

  private requestStatusLabel(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized.includes('ACEPT')) {
      return 'Aprobado';
    }

    if (normalized.includes('RECHAZ')) {
      return 'Rechazado';
    }

    if (normalized.includes('PROCES') || normalized.includes('CONTACT')) {
      return 'En revision';
    }

    if (normalized.includes('PEND')) {
      return 'Pendiente';
    }

    return status || 'Sin estado';
  }

  private calendarTone(statusTone: StatusBadgeTone): StudentAttendanceTone | undefined {
    if (
      statusTone === 'present' ||
      statusTone === 'late' ||
      statusTone === 'absent' ||
      statusTone === 'justified'
    ) {
      return statusTone;
    }

    return undefined;
  }

  private currentMonthLabel(): string {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }

  private sortByRawDateDescending(left: string, right: string): number {
    const leftTime = new Date(left).getTime();
    const rightTime = new Date(right).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  }
}

function readBooleanLike(record: UnknownRecord | null | undefined, key: string): boolean {
  const value = record?.[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    return value === '1' || value.toLowerCase() === 'true';
  }

  return false;
}
