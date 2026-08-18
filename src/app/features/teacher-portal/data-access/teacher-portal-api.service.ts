import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  UnknownRecord,
  formatApiDate,
  formatApiTime,
  initialsFromName,
  readBoolean,
  readFirstString,
  readFullName,
  readId,
  readNumber,
  readShortName,
  readString,
  toRecord,
  toneFromAttendanceStatus,
  toneFromRequestStatus,
  unwrapData,
} from '../../../core/api/api-adapter';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import { SseEvent, fetchEventStream } from '../../../core/api/sse-client';
import { SessionService } from '../../../core/authentication/session.service';
import { StatusBadgeTone } from '../../../shared/components/status-badge/status-badge.component';

export type AttendanceMark = 'present' | 'late' | 'absent' | 'justified';

export interface TeacherClassView {
  id: string;
  scheduleId: string;
  groupId: string;
  start: string;
  end: string;
  group: string;
  classroom: string;
  subject: string;
  status: 'done' | 'active' | 'next';
  countdown?: string;
  sessionId?: string;
}

export interface TeacherProfileView {
  id: string;
  name: string;
  shortName: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  tutoredGroups: string[];
}

export const EMPTY_TEACHER_PROFILE: TeacherProfileView = {
  id: '',
  name: '',
  shortName: '',
  role: '',
  email: '',
  phone: '',
  address: '',
  avatarUrl: '/profile-avatar.svg',
  tutoredGroups: [],
};

export interface TeacherGroupView {
  id: string;
  group: string;
  career: string;
  subject: string;
  description: string;
  students: number;
}

export interface TeacherStudentView {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  group: string;
  status: string;
  statusTone: StatusBadgeTone;
  attendance: number;
  absenceCount: number;
  lateCount: number;
  justificationCount: number;
  todayPresentCount: number;
  todayAbsentCount: number;
  weeklyAbsenceCount: number;
  avatarUrl?: string;
}

export interface TeacherAttendanceStudentView {
  id: string;
  name: string;
  enrollment: string;
  avatarUrl: string;
  status: AttendanceMark;
  disabled?: boolean;
}

export interface TeacherIncidentView {
  id: string;
  type: string;
  title: string;
  date: string;
  reporter: string;
  priority: string;
  tone: StatusBadgeTone;
  icon: string;
  status: string;
  description: string;
  evidenceUrl: string;
}

export interface TeacherIncidentDetailView extends TeacherIncidentView {
  groups: string[];
  students: TeacherEmergencyStudentView[];
  history: TeacherTimelineItemView[];
}

export interface TeacherEmergencyStudentView {
  id: string;
  name: string;
  enrollment: string;
  status: 'PRESENTE' | 'AUSENTE' | '';
}

export interface TeacherTimelineItemView {
  title: string;
  description: string;
  actor: string;
  date: string;
}

export interface TeacherAttendanceHistoryView {
  id: string;
  date: string;
  rawDate: string;
  subject: string;
  time: string;
  classTimeRange: string;
  checkInDelayLabel: string;
  status: string;
  statusTone: StatusBadgeTone;
}

export interface TeacherJustificationHistoryView {
  id: string;
  date: string;
  type: string;
  typeTone: StatusBadgeTone;
  subject: string;
  teacherName: string;
  reason: string;
  evidenceUrl: string;
  evidenceIcon: string;
  reviewedByName: string;
  reviewedAt: string;
  comment: string;
}

export interface TeacherJustificationDetailView {
  id: string;
  subject: string;
  date: string;
  reason: string;
  status: string;
  statusTone: StatusBadgeTone;
  evidenceUrl: string;
  reviewedBy: string;
  comment: string;
}

export const EMPTY_TEACHER_JUSTIFICATION_DETAIL: TeacherJustificationDetailView = {
  id: '',
  subject: '',
  date: '',
  reason: '',
  status: '',
  statusTone: 'neutral',
  evidenceUrl: '',
  reviewedBy: '',
  comment: '',
};

export interface TeacherStudentTutorView {
  id: string;
  fullName: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface TeacherStudentNotificationResult {
  recipientsCount: number;
}

export interface TeacherStudentProfileView {
  id: string;
  name: string;
  fullName: string;
  enrollment: string;
  email: string;
  group: string;
  department: string;
  academicTutor: string;
  tutors: TeacherStudentTutorView[];
  avatarUrl: string;
  attendance: number;
  justifications: string;
}

export interface TeacherSessionStateView {
  sessionId: string;
  sessionOpen: boolean;
  students: TeacherAttendanceStudentView[];
}

export interface TeacherIncidentPayload {
  type: string;
  title: string;
  description: string;
  severity: string;
  groupIds: string[];
  evidence?: File | null;
}

export interface TeacherIncidentUpdatePayload {
  type: string;
  title: string;
  description: string;
  severity: string;
  groupIds?: string[];
  evidence?: File | null;
}

export const EMPTY_TEACHER_STUDENT_PROFILE: TeacherStudentProfileView = {
  id: '',
  name: '',
  fullName: '',
  enrollment: '',
  email: '',
  group: '',
  department: '',
  academicTutor: '',
  tutors: [],
  avatarUrl: '/profile-avatar.svg',
  attendance: 0,
  justifications: '0',
};

export const EMPTY_TEACHER_INCIDENT_DETAIL: TeacherIncidentDetailView = {
  id: '',
  type: '',
  title: '',
  date: '',
  reporter: '',
  priority: '',
  tone: 'neutral',
  icon: 'fa-regular fa-circle-question',
  status: '',
  description: '',
  evidenceUrl: '',
  groups: [],
  students: [],
  history: [],
};

@Injectable({
  providedIn: 'root',
})
export class TeacherPortalApiService {
  private readonly api = inject(CheckmateApiService);
  private readonly sessionService = inject(SessionService);

  getProfile(): Observable<TeacherProfileView> {
    return this.api.get<unknown>('/profesor/profile').pipe(
      map((response) => this.toProfile(unwrapData(response))),
    );
  }

  updateProfile(phone: string | null, photo: File | null): Observable<TeacherProfileView> {
    const formData = new FormData();
    // PHP nunca parsea multipart/form-data en peticiones PUT (solo en POST), asi
    // que se manda como POST con _method=PUT (method spoofing) para que Laravel
    // enrute al mismo controlador y el archivo se reciba correctamente.
    formData.set('_method', 'PUT');

    if (phone) {
      formData.set('phone', phone);
    }

    if (photo) {
      formData.set('photo', photo);
    }

    return this.api.post<unknown>('/profesor/profile', formData).pipe(
      map((response) => this.toProfile(unwrapData(response))),
    );
  }

  getTodayClasses(): Observable<TeacherClassView[]> {
    return this.api.getCollection('/profesor/schedule/today', (item) => this.toClass(item));
  }

  getGroups(): Observable<TeacherGroupView[]> {
    return this.api.getCollection('/profesor/groups', (item) => this.toGroup(item));
  }

  getGroupStudents(groupId: string): Observable<TeacherStudentView[]> {
    return this.api.getCollection(`/profesor/groups/${groupId}/students`, (item) =>
      this.toGroupStudent(item),
    );
  }

  /**
   * Grouped by day_of_week (Spanish uppercase, matching the backend's convention), used to find
   * the nearest upcoming class when nothing is happening today.
   */
  getWeekSchedule(): Observable<Record<string, TeacherClassView[]>> {
    return this.api.get<unknown>('/profesor/schedule').pipe(
      map((response) => {
        const record = toRecord(unwrapData(response)) ?? {};
        const result: Record<string, TeacherClassView[]> = {};

        for (const [day, items] of Object.entries(record)) {
          result[day] = Array.isArray(items) ? items.map((item) => this.toClass(item)) : [];
        }

        return result;
      }),
    );
  }

  getSessionState(scheduleId: string | null): Observable<TeacherSessionStateView> {
    if (!scheduleId) {
      return of({ sessionId: '', sessionOpen: false, students: [] });
    }

    return this.api.get<unknown>(`/profesor/schedule/${scheduleId}/session`).pipe(
      map((response) => this.toSessionState(unwrapData(response))),
    );
  }

  /**
   * Reads the live session-state SSE stream for a schedule, reconnecting to the same URL
   * (bumping the cursor) whenever the server-side connection window ends, so a chain of
   * bounded streams reads as continuous real-time updates from the caller's perspective.
   */
  streamSessionState(scheduleId: string): Observable<SseEvent> {
    return new Observable<SseEvent>((subscriber) => {
      let cursor = 0;
      let stopped = false;
      let inner = { unsubscribe: () => {} };

      const connect = (): void => {
        if (stopped) {
          return;
        }

        const token = this.sessionService.authToken();
        const url = `${environment.checkmateApiUrl}/profesor/schedule/${scheduleId}/stream?since_attendance_id=${cursor}`;
        const headers: Record<string, string> = token
          ? { Authorization: `${this.sessionService.tokenType() ?? 'Bearer'} ${token}` }
          : {};

        inner = fetchEventStream(url, headers).subscribe({
          next: (event) => {
            if (event.event === 'attendance') {
              const attendanceId = readNumber(toRecord(event.data), 'attendance_id', 0);
              cursor = Math.max(cursor, attendanceId);
            }

            subscriber.next(event);
          },
          error: () => {
            if (!stopped) {
              setTimeout(connect, 3000);
            }
          },
          complete: () => connect(),
        });
      };

      connect();

      return () => {
        stopped = true;
        inner.unsubscribe();
      };
    });
  }

  saveAttendance(
    scheduleId: string,
    marks: Record<string, AttendanceMark>,
    existingSessionId?: string,
  ): Observable<boolean> {
    const session$ = existingSessionId
      ? of(existingSessionId)
      : this.api
          .post<unknown>('/profesor/sessions/open', {
            schedule_id: Number(scheduleId),
            date: new Date().toISOString().slice(0, 10),
          })
          .pipe(map((response) => this.sessionIdFromResponse(response)));

    return session$.pipe(
      switchMap((sessionId) => {
        const updates = Object.entries(marks)
          .filter(([, status]) => status !== 'justified')
          .map(([studentId, status]) =>
            this.api
              .patch<unknown>(`/profesor/sessions/${sessionId}/students/${studentId}`, {
                status: this.toApiAttendanceStatus(status),
              })
              .pipe(map(() => true)),
          );

        return updates.length ? forkJoin(updates).pipe(map(() => true)) : of(true);
      }),
    );
  }

  getIncidents(): Observable<TeacherIncidentView[]> {
    return this.api.getCollection('/profesor/incidents', (item) => this.toIncident(item));
  }

  getActiveIncidents(): Observable<TeacherIncidentView[]> {
    return this.api.getCollection('/profesor/incidents/active', (item) => this.toIncident(item));
  }

  getIncident(incidentId: string | null): Observable<TeacherIncidentDetailView> {
    if (!incidentId) {
      return of(EMPTY_TEACHER_INCIDENT_DETAIL);
    }

    return this.api.get<unknown>(`/profesor/incidents/${incidentId}`).pipe(
      map((response) => this.toIncidentDetail(unwrapData(response))),
    );
  }

  getEmergencyIncident(): Observable<TeacherIncidentDetailView> {
    return this.getActiveIncidents().pipe(
      map((incidents) => incidents[0]?.id ?? null),
      switchMap((incidentId) => this.getIncident(incidentId)),
      catchError(() => of(EMPTY_TEACHER_INCIDENT_DETAIL)),
    );
  }

  createIncident(payload: TeacherIncidentPayload): Observable<TeacherIncidentDetailView> {
    const formData = new FormData();
    formData.set('type', payload.type);

    const title = payload.title.trim();
    if (title) {
      formData.set('title', title);
    }

    const description = payload.description.trim();
    if (description) {
      formData.set('description', description);
    }

    if (payload.severity) {
      formData.set('severity', payload.severity);
    }

    payload.groupIds.forEach((groupId) => formData.append('group_ids[]', groupId));

    if (payload.evidence) {
      formData.set('evidence', payload.evidence);
    }

    return this.api
      .post<unknown>('/profesor/incidents', formData)
      .pipe(map((response) => this.toIncidentDetail(unwrapData(response))));
  }

  updateIncident(
    incidentId: string,
    payload: TeacherIncidentUpdatePayload,
  ): Observable<TeacherIncidentDetailView> {
    const formData = new FormData();
    formData.set('_method', 'PUT');
    formData.set('type', payload.type);
    formData.set('title', payload.title);
    formData.set('description', payload.description);
    formData.set('severity', payload.severity);
    (payload.groupIds ?? []).forEach((groupId) => formData.append('group_ids[]', groupId));

    if (payload.evidence) {
      formData.set('evidence', payload.evidence);
    }

    return this.api
      .post<unknown>(`/profesor/incidents/${incidentId}`, formData)
      .pipe(map((response) => this.toIncidentDetail(unwrapData(response))));
  }

  updateIncidentStudents(
    incidentId: string,
    marks: Record<string, 'present' | 'absent' | ''>,
  ): Observable<boolean> {
    const students = Object.entries(marks)
      .filter(([, status]) => status !== '')
      .map(([studentId, status]) => ({
        student_id: Number(studentId),
        present: status === 'present',
      }));

    if (!students.length) {
      return of(true);
    }

    return this.api
      .patch<unknown>(`/profesor/incidents/${incidentId}/students`, {
        students,
      })
      .pipe(map(() => true));
  }

  getStudentProfile(studentId: string | null): Observable<TeacherStudentProfileView> {
    if (!studentId) {
      return of(EMPTY_TEACHER_STUDENT_PROFILE);
    }

    return forkJoin({
      profile: this.api
        .get<unknown>(`/profesor/students/${studentId}`)
        .pipe(map((response) => this.toStudentProfile(unwrapData(response), studentId))),
      attendance: this.getStudentAttendance(studentId).pipe(catchError(() => of([]))),
      justifications: this.getStudentJustifications(studentId).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ profile, attendance, justifications }) => ({
        ...profile,
        attendance: this.attendanceRate(attendance),
        justifications: String(justifications.length).padStart(2, '0'),
      })),
    );
  }

  notifyStudentTutors(
    studentId: string,
    title: string,
    message: string,
  ): Observable<TeacherStudentNotificationResult> {
    return this.api.post<unknown>(`/profesor/students/${studentId}/notify`, { title, message }).pipe(
      map((response) => {
        const record = toRecord(unwrapData(response));

        return { recipientsCount: readNumber(record, 'recipients_count', 0) };
      }),
    );
  }

  getStudentAttendance(studentId: string | null): Observable<TeacherAttendanceHistoryView[]> {
    if (!studentId) {
      return of([]);
    }

    return this.api.getCollection(`/profesor/students/${studentId}/attendance`, (item) =>
      this.toAttendanceHistory(item),
    );
  }

  getStudentJustifications(studentId: string | null): Observable<TeacherJustificationHistoryView[]> {
    if (!studentId) {
      return of([]);
    }

    return this.api.getCollection(`/profesor/students/${studentId}/justifications`, (item) =>
      this.toJustificationHistory(item),
    );
  }

  getJustificationDetail(justificationId: string | null): Observable<TeacherJustificationDetailView> {
    if (!justificationId) {
      return of(EMPTY_TEACHER_JUSTIFICATION_DETAIL);
    }

    return this.api.get<unknown>(`/profesor/justifications/${justificationId}`).pipe(
      map((response) => this.toJustificationDetail(unwrapData(response))),
      catchError(() => of(EMPTY_TEACHER_JUSTIFICATION_DETAIL)),
    );
  }

  private toProfile(value: unknown): TeacherProfileView {
    const record = toRecord(value);
    const role = readString(record, 'role');
    const tutoredGroups = Array.isArray(record?.['tutored_groups']) ? record?.['tutored_groups'] : [];

    return {
      id: readId(record),
      name: readFullName(record),
      shortName: readShortName(record),
      role: role === 'tutor_academico' ? 'Profesor tutor' : 'Profesor',
      email: readString(record, 'email'),
      phone: readString(record, 'phone'),
      address: readString(record, 'address'),
      avatarUrl: readFirstString(record, ['photo_url', 'avatar_url'], '/profile-avatar.svg'),
      tutoredGroups: tutoredGroups.map((group) => this.groupLabel(toRecord(group))),
    };
  }

  private toClass(value: unknown): TeacherClassView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const group = toRecord(record?.['group']);
    const classroom = toRecord(record?.['classroom']);
    const start = readFirstString(record, ['start_time', 'start']);
    const end = readFirstString(record, ['end_time', 'end']);
    const status = this.classStatus(start, end, readBooleanLike(record, 'session_open'));
    const scheduleId = readFirstString(record, ['schedule_id', 'id']);

    return {
      id: scheduleId,
      scheduleId,
      groupId: readFirstString(group, ['id', 'group_id'], readString(record, 'group_id')),
      start,
      end,
      group: this.groupLabel(group),
      classroom: readFirstString(classroom, ['name', 'label'], readString(record, 'classroom')),
      subject: readString(subject, 'name', readString(record, 'subject')),
      status,
      countdown: status === 'active' ? 'En curso' : undefined,
      sessionId: readString(record, 'session_id'),
    };
  }

  private toGroup(value: unknown): TeacherGroupView {
    const record = toRecord(value);
    const career = toRecord(record?.['career']);

    return {
      id: readId(record),
      group: this.groupLabel(record),
      career: readFirstString(career, ['short_name', 'name']),
      subject: readString(record, 'subject'),
      description: readString(record, 'description'),
      students: readNumber(record, 'student_count', 0),
    };
  }

  private toGroupStudent(value: unknown): TeacherStudentView {
    const record = toRecord(value);
    const group = toRecord(record?.['group']);
    const attendance = readNumber(record, 'attendance_rate', 0);
    const active = readBooleanLike(record, 'active');

    const id = readId(record);

    return {
      id,
      name: readFullName(record),
      email: readString(record, 'email'),
      enrollment: readFirstString(record, ['control_number', 'enrollment', 'matricula', 'student_number']) || id,
      group: this.groupLabel(group),
      status: active ? 'Activo' : 'Inactivo',
      statusTone: active ? 'present' : 'neutral',
      attendance,
      absenceCount: readNumber(record, 'absence_count', 0),
      lateCount: readNumber(record, 'late_count', 0),
      justificationCount: readNumber(record, 'justification_count', 0),
      todayPresentCount: readNumber(record, 'today_present_count', 0),
      todayAbsentCount: readNumber(record, 'today_absent_count', 0),
      weeklyAbsenceCount: readNumber(record, 'weekly_absence_count', 0),
      avatarUrl: readFirstString(record, ['photo_url', 'avatar_url']) || undefined,
    };
  }

  private toSessionState(value: unknown): TeacherSessionStateView {
    const record = toRecord(value);
    const session = toRecord(record?.['session']);
    const students = Array.isArray(record?.['students']) ? record?.['students'] : [];

    return {
      sessionId: readString(session, 'id'),
      sessionOpen: readString(session, 'status') === 'ABIERTA',
      students: students.map((item) => this.toSessionStudent(item)),
    };
  }

  private toSessionStudent(value: unknown): TeacherAttendanceStudentView {
    const record = toRecord(value);
    const status = readString(record, 'status');

    return {
      id: readId(record),
      name: readFullName(record),
      enrollment: readFirstString(record, ['control_number', 'enrollment', 'matricula', 'student_number']) || readId(record),
      avatarUrl: readFirstString(record, ['photo_url', 'avatar_url']) || '/profile-avatar.svg',
      status: this.toAttendanceMark(status),
    };
  }

  private toAttendanceMark(status: string): AttendanceMark {
    if (status === 'PRESENTE') {
      return 'present';
    }

    if (status === 'RETARDO') {
      return 'late';
    }

    if (status === 'JUSTIFICADA') {
      return 'justified';
    }

    return 'absent';
  }

  private toIncident(value: unknown): TeacherIncidentView {
    const record = toRecord(value);
    const reporter = toRecord(record?.['reporter']);
    const severity = readString(record, 'severity');
    const type = readString(record, 'type');
    const status = readString(record, 'status');

    return {
      id: readId(record),
      type,
      title: readString(record, 'title', type),
      date: formatApiDate(readFirstString(record, ['created_at', 'date'])),
      reporter: readFullName(reporter),
      priority: severity,
      tone: this.severityTone(severity),
      icon: this.incidentIcon(type),
      status,
      description: readString(record, 'description'),
      evidenceUrl: readString(record, 'evidence_url'),
    };
  }

  private toIncidentDetail(value: unknown): TeacherIncidentDetailView {
    const base = this.toIncident(value);
    const record = toRecord(value);
    const groups = Array.isArray(record?.['groups']) ? record?.['groups'] : [];
    const students = Array.isArray(record?.['students']) ? record?.['students'] : [];
    const history = Array.isArray(record?.['history']) ? record?.['history'] : [];

    return {
      ...base,
      groups: groups.map((item) => this.groupLabel(toRecord(item))),
      students: students.map((item) => this.toEmergencyStudent(item)),
      history: history.map((item) => this.toTimelineItem(item)),
    };
  }

  private toEmergencyStudent(value: unknown): TeacherEmergencyStudentView {
    const record = toRecord(value);
    const rawStatus = readString(record, 'status');
    const status = rawStatus === 'PRESENTE' || rawStatus === 'AUSENTE' ? rawStatus : '';

    return {
      id: readId(record),
      name: readFullName(record),
      enrollment: readFirstString(record, ['control_number', 'enrollment', 'student_number']),
      status,
    };
  }

  private toTimelineItem(value: unknown): TeacherTimelineItemView {
    const record = toRecord(value);
    const performedBy = toRecord(record?.['performed_by']);
    const action = readString(record, 'action');
    const before = toRecord(record?.['before']);
    const after = toRecord(record?.['after']);
    const createdAt = readString(record, 'created_at');

    return {
      title: action === 'CREATE' ? 'Incidente creado' : 'Incidente actualizado',
      description: this.historyChangeSummary(before, after),
      actor: readFullName(performedBy),
      date: [formatApiDate(createdAt), formatApiTime(createdAt)].filter(Boolean).join(' · '),
    };
  }

  private historyChangeSummary(
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
  ): string {
    if (!after) {
      return 'Sin detalle disponible.';
    }

    const keys = Object.keys(after);

    if (keys.includes('student_id') && keys.includes('status')) {
      return `Alumno #${String(after['student_id'])}: ${this.historyValueLabel('status', after['status'])}.`;
    }

    if (!before) {
      return keys
        .filter((key) => key !== 'status')
        .map((key) => `${this.historyFieldLabel(key)}: ${this.historyValueLabel(key, after[key])}`)
        .join(' · ');
    }

    const changes = keys
      .filter((key) => before[key] !== after[key])
      .map(
        (key) =>
          `${this.historyFieldLabel(key)}: ${this.historyValueLabel(key, before[key])} → ${this.historyValueLabel(key, after[key])}`,
      );

    return changes.length ? changes.join(' · ') : 'Sin cambios detectados.';
  }

  private historyFieldLabel(key: string): string {
    const labels: Record<string, string> = {
      type: 'Tipo',
      title: 'Titulo',
      description: 'Descripcion',
      severity: 'Severidad',
      evidence: 'Evidencia',
      status: 'Estado',
    };

    return labels[key] ?? key;
  }

  private historyValueLabel(key: string, value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return key === 'severity' ? 'No especificada' : 'Sin definir';
    }

    const text = String(value);

    if (key === 'type') {
      return this.typeLabel(text);
    }

    if (key === 'status') {
      const labels: Record<string, string> = {
        DESCONOCIDO: 'Sin verificar',
        PRESENTE: 'Presente',
        AUSENTE: 'Ausente',
        EXTRAVIADO: 'Extraviado',
        SEGURO: 'A salvo',
      };

      return labels[text.toUpperCase()] ?? text;
    }

    if (key === 'evidence') {
      return 'Archivo actualizado';
    }

    if ((key === 'title' || key === 'description') && text.length > 60) {
      return `${text.slice(0, 57)}...`;
    }

    return text;
  }

  private typeLabel(type: string): string {
    const labels: Record<string, string> = {
      FIRE: 'Incendio',
      GAS: 'Gas',
      EARTHQUAKE: 'Terremoto',
      OTHER: 'Otro',
    };

    return labels[type.toUpperCase()] ?? type;
  }

  private toStudentProfile(value: unknown, fallbackId: string): TeacherStudentProfileView {
    const record = toRecord(value);
    const group = toRecord(record?.['group']);
    const career = toRecord(group?.['career']) ?? toRecord(record?.['career']);
    const rawTutors = Array.isArray(record?.['tutors']) ? record?.['tutors'] : [];
    const tutors = rawTutors.map((item) => this.toStudentTutor(item));
    const academicTutor = toRecord(record?.['academic_tutor']);
    const name = readFullName(record);
    const id = readId(record, fallbackId);

    return {
      id,
      name,
      fullName: name,
      enrollment: readFirstString(record, ['control_number', 'enrollment', 'matricula', 'student_number']) || id,
      email: readString(record, 'email'),
      group: this.groupLabel(group),
      department: readFirstString(career, ['short_name', 'name']),
      academicTutor: readFullName(academicTutor),
      tutors,
      avatarUrl: readFirstString(record, ['photo_url', 'avatar_url'], '/profile-avatar.svg'),
      attendance: readNumber(record, 'attendance_rate', 0),
      justifications: '0',
    };
  }

  private toStudentTutor(value: unknown): TeacherStudentTutorView {
    const record = toRecord(value);

    return {
      id: readId(record, ''),
      fullName: readString(record, 'full_name'),
      phone: readString(record, 'phone'),
      relationship: readString(record, 'relationship'),
      isPrimary: readBoolean(record, 'is_primary', false),
    };
  }

  private toAttendanceHistory(value: unknown): TeacherAttendanceHistoryView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const rawStatus = readString(record, 'status');
    const rawDate = readFirstString(record, ['date', 'checked_in_at', 'registered_at']);
    const startTime = readString(record, 'class_start_time');
    const endTime = readString(record, 'class_end_time');
    const delayMinutes = record?.['check_in_delay_minutes'];

    return {
      id: readFirstString(record, ['attendance_id', 'id']),
      date: formatApiDate(rawDate),
      rawDate,
      subject: readString(subject, 'name', readString(record, 'subject')),
      time: formatApiTime(readFirstString(record, ['checked_in_at', 'registered_at'])),
      classTimeRange: startTime && endTime ? `${startTime} - ${endTime}` : startTime,
      checkInDelayLabel: typeof delayMinutes === 'number' ? this.checkInDelayLabel(delayMinutes) : '',
      status: this.attendanceStatusLabel(rawStatus),
      statusTone: toneFromAttendanceStatus(rawStatus),
    };
  }

  private checkInDelayLabel(delayMinutes: number): string {
    if (delayMinutes <= 0) {
      return 'Registro justo al abrir la clase';
    }

    if (delayMinutes === 1) {
      return 'Registro 1 min despues de abrir la clase';
    }

    return `Registro ${delayMinutes} min despues de abrir la clase`;
  }

  private toJustificationHistory(value: unknown): TeacherJustificationHistoryView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const reviewedBy = toRecord(record?.['reviewed_by']);
    const status = readString(record, 'status');

    return {
      id: readId(record),
      date: formatApiDate(readFirstString(record, ['created_at', 'submitted_at', 'date'])),
      type: this.requestStatusLabel(status),
      typeTone: toneFromRequestStatus(status),
      subject: readString(subject, 'name', readString(record, 'subject')),
      teacherName: readString(record, 'teacher'),
      reason: readString(record, 'reason'),
      evidenceUrl: readString(record, 'evidence_url'),
      evidenceIcon: readString(record, 'evidence_url') ? 'fa-regular fa-file-lines' : 'fa-regular fa-file',
      reviewedByName: readFullName(reviewedBy),
      reviewedAt: formatApiDate(readString(record, 'reviewed_at')),
      comment: readString(record, 'comment'),
    };
  }

  private toJustificationDetail(value: unknown): TeacherJustificationDetailView {
    const record = toRecord(value);
    const subject = toRecord(record?.['subject']);
    const reviewedBy = toRecord(record?.['reviewed_by']);
    const status = readString(record, 'status');

    return {
      id: readId(record),
      subject: readString(subject, 'name'),
      date: formatApiDate(readString(record, 'date')),
      reason: readFirstString(record, ['reason', 'description'], 'Sin motivo registrado.'),
      status: this.requestStatusLabel(status),
      statusTone: toneFromRequestStatus(status),
      evidenceUrl: readString(record, 'evidence_url'),
      reviewedBy: readFullName(reviewedBy),
      comment: readString(record, 'comment'),
    };
  }

  private classStatus(start: string, end: string, sessionOpen: boolean): TeacherClassView['status'] {
    if (sessionOpen) {
      return 'active';
    }

    const now = new Date();
    const startDate = this.timeToday(start);
    const endDate = this.timeToday(end);

    if (startDate && endDate && now > endDate) {
      return 'done';
    }

    return startDate && now >= startDate ? 'active' : 'next';
  }

  private timeToday(value: string): Date | null {
    if (!value) {
      return null;
    }

    const [hours, minutes] = value.split(':').map((part) => Number(part));

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private sessionIdFromResponse(response: unknown): string {
    const data = toRecord(unwrapData(response));
    return readFirstString(data, ['session_id', 'id']);
  }

  private toApiAttendanceStatus(status: AttendanceMark): 'PRESENTE' | 'RETARDO' | 'FALTA' {
    if (status === 'present') {
      return 'PRESENTE';
    }

    if (status === 'late') {
      return 'RETARDO';
    }

    return 'FALTA';
  }

  private attendanceRate(records: readonly TeacherAttendanceHistoryView[]): number {
    if (!records.length) {
      return 0;
    }

    const present = records.filter(
      (record) => record.statusTone === 'present' || record.statusTone === 'justified',
    ).length;

    return Math.round((present / records.length) * 100);
  }

  private groupLabel(record: UnknownRecord | null | undefined): string {
    const label = readString(record, 'label');

    if (label) {
      return label;
    }

    const grade = readString(record, 'grade');
    const section = readString(record, 'section');
    return [grade, section].filter(Boolean).join('-');
  }

  private severityTone(severity: string): StatusBadgeTone {
    const normalized = severity.toUpperCase();

    if (normalized.includes('CRIT') || normalized.includes('ALTA')) {
      return 'danger';
    }

    if (normalized.includes('MEDIA')) {
      return 'warning';
    }

    return 'neutral';
  }

  private incidentIcon(type: string): string {
    const normalized = type.toUpperCase();

    if (normalized.includes('FIRE') || normalized.includes('FUEGO')) {
      return 'fa-solid fa-fire-flame-curved';
    }

    if (normalized.includes('GAS')) {
      return 'fa-solid fa-fire-extinguisher';
    }

    if (normalized.includes('EARTH') || normalized.includes('TERREMOTO')) {
      return 'fa-solid fa-wave-square';
    }

    return 'fa-solid fa-triangle-exclamation';
  }

  private attendanceStatusLabel(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized.includes('PRESENTE')) {
      return 'A tiempo';
    }

    if (normalized.includes('RETARDO')) {
      return 'Retardo';
    }

    if (normalized.includes('JUSTIFIC')) {
      return 'Justificado';
    }

    if (normalized.includes('FALTA')) {
      return 'Inasistencia';
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
      return 'En proceso';
    }

    if (normalized.includes('PEND')) {
      return 'Pendiente';
    }

    return status || 'Sin estado';
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
