import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/authentication/auth.service';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import { unwrapData } from '../../../core/api/api-adapter';
import { UserRole } from '../../../core/enums/user-role.enum';
import { apiErrorMessage } from '../../../shared/utils/api-error.util';
import {
  DeviceCreatePayload,
  EMPTY_MANAGEMENT_SNAPSHOT,
  IncidentCreatePayload,
  ManagementActionResult,
  ManagementAuditLog,
  ManagementCharts,
  ManagementClaim,
  ManagementClassroom,
  ManagementDevice,
  ManagementGroup,
  ManagementIncident,
  ManagementJustification,
  ManagementSchedule,
  ManagementSnapshot,
  ManagementStatus,
  ManagementStudent,
  ManagementSubject,
  ManagementTeacher,
} from '../models/management.model';

type UnknownRecord = Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class ManagementDataService {
  private readonly authService = inject(AuthService);
  private readonly checkmateApi = inject(CheckmateApiService);

  /**
   * Groups, the students of the first group and its schedule are fetched once here and
   * threaded through, instead of letting getStudents()/getSchedules()/getJustifications()
   * each independently re-fetch groups (and getJustifications() re-fetch students on top of
   * that) — those redundant round trips used to multiply the real number of requests fired
   * by this single screen load.
   */
  getSnapshot(): Observable<ManagementSnapshot> {
    return this.getGroups()
      .pipe(catchError(() => of([])))
      .pipe(
        switchMap((groups) => {
          const groupId = groups[0]?.id;

          return forkJoin({
            groups: of(groups),
            students: this.studentsForGroup(groupId).pipe(catchError(() => of([]))),
            teachers: this.getTeachers().pipe(catchError(() => of([]))),
            schedules: this.schedulesForGroup(groupId).pipe(catchError(() => of([]))),
            devices: this.getDevices().pipe(catchError(() => of([]))),
            incidents: this.getIncidents().pipe(catchError(() => of([]))),
            claims: this.getClaims().pipe(catchError(() => of([]))),
            logs: this.getLogs('students').pipe(catchError(() => of([]))),
            charts: this.getCharts().pipe(catchError(() => of(EMPTY_MANAGEMENT_SNAPSHOT.charts))),
          });
        }),
        switchMap((partial) =>
          forkJoin({
            subjects: this.subjectsFor(partial.schedules).pipe(catchError(() => of([]))),
            justifications: this.justificationsForStudent(partial.students[0]?.id).pipe(
              catchError(() => of([])),
            ),
          }).pipe(map((rest) => ({ ...partial, ...rest }))),
        ),
      );
  }

  private studentsForGroup(groupId: string | undefined): Observable<ManagementStudent[]> {
    if (this.currentRole() === UserRole.CAREER_DIRECTOR) {
      return groupId
        ? this.checkmateApi.getCollection(`${this.directorBase()}/groups/${groupId}/students`, (item, index) =>
            this.toStudent(item, index),
          )
        : of([]);
    }

    if (this.currentRole() === UserRole.ADMIN) {
      return this.checkmateApi.getCollection(`${this.adminBase()}/students`, (item, index) =>
        this.toStudent(item, index),
      );
    }

    return of([]);
  }

  private schedulesForGroup(groupId: string | undefined): Observable<ManagementSchedule[]> {
    if (this.currentRole() !== UserRole.CAREER_DIRECTOR) {
      return of([]);
    }

    return groupId
      ? this.checkmateApi.getCollection(`${this.directorBase()}/groups/${groupId}/schedule`, (item, index) =>
          this.toSchedule(item, index),
        )
      : of([]);
  }

  private subjectsFor(schedules: ManagementSchedule[]): Observable<ManagementSubject[]> {
    if (this.currentRole() === UserRole.ADMIN) {
      return this.checkmateApi.getCollection(`${this.adminBase()}/subjects`, (item, index) =>
        this.toSubject(item, index),
      );
    }

    if (this.currentRole() === UserRole.CAREER_DIRECTOR) {
      return of(this.subjectsFromSchedules(schedules));
    }

    return of([]);
  }

  private justificationsForStudent(studentId: string | undefined): Observable<ManagementJustification[]> {
    if (this.currentRole() !== UserRole.CAREER_DIRECTOR) {
      return of([]);
    }

    return studentId
      ? this.checkmateApi.getCollection(
          `${this.directorBase()}/students/${studentId}/justifications`,
          (item, index) => this.toJustification(item, index),
        )
      : of([]);
  }

  getGroups(): Observable<ManagementGroup[]> {
    return this.checkmateApi.getCollection(`${this.scopeBase()}/groups`, (item, index) => this.toGroup(item, index));
  }

  getTeachers(): Observable<ManagementTeacher[]> {
    return this.checkmateApi.getCollection(`${this.scopeBase()}/teachers`, (item, index) =>
      this.toTeacher(item, index),
    );
  }

  getDevices(): Observable<ManagementDevice[]> {
    return this.checkmateApi.getCollection(`${this.scopeBase()}/devices`, (item, index) =>
      this.toDevice(item, index),
    );
  }

  getClassrooms(): Observable<ManagementClassroom[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/classrooms`, (item, index) =>
      this.toClassroom(item, index),
    );
  }

  getIncidents(): Observable<ManagementIncident[]> {
    if (this.currentRole() !== UserRole.CAREER_DIRECTOR) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.directorBase()}/incidents`, (item, index) =>
      this.toIncident(item, index),
    );
  }

  getClaims(): Observable<ManagementClaim[]> {
    if (this.currentRole() === UserRole.CAREER_DIRECTOR) {
      return this.checkmateApi.getCollection(`${this.directorBase()}/claims`, (item, index) =>
        this.toClaim(item, index),
      );
    }

    if (this.currentRole() === UserRole.TUTOR_TEACHER) {
      return this.checkmateApi.getCollection(`${this.tutorBase()}/claims`, (item, index) =>
        this.toClaim(item, index),
      );
    }

    return of([]);
  }

  getLogs(entity: ManagementAuditLog['entity']): Observable<ManagementAuditLog[]> {
    if (this.currentRole() !== UserRole.CAREER_DIRECTOR) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.directorBase()}/logs/${entity}`, (item, index) =>
      this.toLog(item, index, entity),
    );
  }

  getCharts(): Observable<ManagementCharts> {
    if (this.currentRole() !== UserRole.CAREER_DIRECTOR) {
      return of(EMPTY_MANAGEMENT_SNAPSHOT.charts);
    }

    return this.checkmateApi.get<unknown>(`${this.directorBase()}/charts/summary`).pipe(
      map((response) => this.toCharts(toRecord(unwrapData(response)) ?? {}, EMPTY_MANAGEMENT_SNAPSHOT.charts)),
      catchError(() => of(EMPTY_MANAGEMENT_SNAPSHOT.charts)),
    );
  }

  createIncident(payload: IncidentCreatePayload): Observable<ManagementActionResult> {
    const formData = new FormData();
    formData.set('title', payload.title);
    formData.set('description', payload.description);
    formData.set('type', payload.type);
    formData.set('severity', payload.severity);
    formData.set('location', payload.location);
    formData.set('schedule_id', payload.scheduleId);
    payload.studentIds.forEach((studentId) => formData.append('student_ids[]', studentId));

    if (payload.evidence) {
      formData.set('evidence', payload.evidence);
    }

    return this.checkmateApi.post<unknown>(`${this.directorBase()}/incidents`, formData).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  closeIncident(incidentId: string, resolution: string): Observable<ManagementActionResult> {
    return this.checkmateApi
      .post<unknown>(`${this.directorBase()}/incidents/${incidentId}/close`, { resolution })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateIncidentStudents(incident: ManagementIncident, notes: string): Observable<ManagementActionResult> {
    return this.checkmateApi
      .patch<unknown>(`${this.directorBase()}/incidents/${incident.id}/students`, {
        students: incident.roster.map((item) => ({
          student_id: item.studentId,
          status: item.status,
          notes,
        })),
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateClaimAction(claimId: string, action: string, comment: string): Observable<ManagementActionResult> {
    const base = this.currentRole() === UserRole.TUTOR_TEACHER ? this.tutorBase() : this.directorBase();
    return this.checkmateApi.patch<unknown>(`${base}/claims/${claimId}/action`, { action, comment }).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  pingDevice(deviceId: string): Observable<boolean> {
    return this.checkmateApi.get<unknown>(`${this.scopeBase()}/devices/${deviceId}/ping`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  createDevice(payload: DeviceCreatePayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .post<unknown>(`${this.adminBase()}/devices`, {
        mac_address: payload.macAddress,
        ip: payload.ipAddress || null,
        classroom_id: payload.classroomId,
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateDevice(
    deviceId: string,
    payload: { ipAddress: string; isActive: boolean; classroomId?: string },
  ): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/devices/${deviceId}`, {
        ip: payload.ipAddress,
        is_active: payload.isActive,
        ...(payload.classroomId ? { classroom_id: payload.classroomId } : {}),
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  private scopeBase(): string {
    return this.currentRole() === UserRole.CAREER_DIRECTOR ? this.directorBase() : this.adminBase();
  }

  private adminBase(): string {
    return '/administrador';
  }

  private directorBase(): string {
    return '/director-carrera';
  }

  private tutorBase(): string {
    return '/tutor';
  }

  private currentRole(): UserRole | undefined {
    return this.authService.currentUser()?.role;
  }

  private subjectsFromSchedules(schedules: ManagementSchedule[]): ManagementSubject[] {
    const unique = new Map<string, ManagementSubject>();

    schedules.forEach((schedule) => {
      if (unique.has(schedule.subject)) {
        return;
      }

      unique.set(schedule.subject, {
        id: schedule.id,
        name: schedule.subject,
        group: schedule.group,
        semester: 'Horario activo',
        teacher: schedule.teacher,
        schedule: schedule.time,
        classroom: schedule.classroom,
      });
    });

    return [...unique.values()];
  }

  private toGroup(value: unknown, index: number): ManagementGroup {
    const record = toRecord(value);
    const fallback = emptyGroup(index);
    const career = toRecord(record?.['career']);

    return {
      id: readId(record, fallback.id),
      label: readString(record, 'label', `${readString(record, 'grade', '10')}${readString(record, 'section', 'A')}`),
      career: readString(career, 'short_name', readString(career, 'name', fallback.career)),
      shift: readString(record, 'shift', fallback.shift),
      studentCount: readNumber(record, 'student_count', fallback.studentCount),
      attendanceRate: readNumber(record, 'attendance_rate', fallback.attendanceRate),
      tutor: readString(record, 'tutor_name', fallback.tutor),
    };
  }

  private toStudent(value: unknown, index: number): ManagementStudent {
    const record = toRecord(value);
    const fallback = emptyStudent(index);
    const group = toRecord(record?.['group']);
    const career = toRecord(group?.['career']);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      controlNumber: readString(record, 'control_number', fallback.controlNumber),
      name: readString(record, 'full_name', readString(record, 'name', fallback.name)),
      group: readString(group, 'label', fallback.group),
      career: readString(career, 'name', fallback.career),
      email: readString(record, 'email', fallback.email),
      phone: readString(record, 'phone', fallback.phone),
      attendanceRate: readNumber(record, 'attendance_rate', fallback.attendanceRate),
      status: readBoolean(record, 'active', true)
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private toTeacher(value: unknown, index: number): ManagementTeacher {
    const record = toRecord(value);
    const fallback = emptyTeacher(index);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      name: readString(record, 'full_name', readString(record, 'name', fallback.name)),
      employeeNumber: readString(record, 'employee_number', fallback.employeeNumber),
      email: readString(record, 'email', fallback.email),
      phone: readString(record, 'phone', fallback.phone),
      schedulesCount: readNumber(record, 'schedules_count', fallback.schedulesCount),
      status: readBoolean(record, 'active', true)
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private toSubject(value: unknown, index: number): ManagementSubject {
    const record = toRecord(value);
    const fallback = emptySubject(index);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      name: readString(record, 'name', fallback.name),
      semester: readString(record, 'semester', fallback.semester),
    };
  }

  private toSchedule(value: unknown, index: number): ManagementSchedule {
    const record = toRecord(value);
    const fallback = emptySchedule(index);
    const subject = toRecord(record?.['subject']);
    const teacher = toRecord(record?.['teacher']);
    const classroom = toRecord(record?.['classroom']);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      day: readString(record, 'day_of_week', fallback.day),
      time: `${readString(record, 'start_time', fallback.time.split(' - ')[0] ?? '')} - ${readString(
        record,
        'end_time',
        fallback.time.split(' - ')[1] ?? '',
      )}`,
      subject: readString(subject, 'name', fallback.subject),
      teacher: readString(teacher, 'full_name', fallback.teacher),
      classroom: readString(classroom, 'name', fallback.classroom),
    };
  }

  private toJustification(value: unknown, index: number): ManagementJustification {
    const record = toRecord(value);
    const fallback = emptyJustification(index);
    const subject = toRecord(record?.['subject']);
    const status = readString(record, 'status', fallback.status.label);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      subject: readString(subject, 'name', fallback.subject),
      reason: readString(record, 'reason', fallback.reason),
      status: statusFromLabel(status),
    };
  }

  private toDevice(value: unknown, index: number): ManagementDevice {
    const record = toRecord(value);
    const fallback = emptyDevice(index);
    const classroom = toRecord(record?.['classroom']);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      name: readString(record, 'name', readString(classroom, 'name', fallback.name)),
      macAddress: readString(record, 'mac_address', fallback.macAddress),
      ipAddress: readString(record, 'ip', fallback.ipAddress),
      classroom: readString(classroom, 'name', fallback.classroom),
      classroomId: readString(record, 'classroom_id', fallback.classroomId),
      building: readString(classroom, 'building', fallback.building),
      status: readBoolean(record, 'is_active', true)
        ? { label: 'Online', tone: 'success' }
        : { label: 'Offline', tone: 'danger' },
    };
  }

  private toClassroom(value: unknown, index: number): ManagementClassroom {
    const record = toRecord(value);

    return {
      id: readId(record, String(index + 1)),
      name: readString(record, 'name', 'Salon'),
      building: readString(record, 'building', ''),
    };
  }

  private toIncident(value: unknown, index: number): ManagementIncident {
    const record = toRecord(value);
    const fallback = emptyIncident(index);
    const reporter = toRecord(record?.['reporter']);
    const status = readString(record, 'status', fallback.status.label);
    const severity = readString(record, 'severity', fallback.severity.label);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      title: readString(record, 'title', fallback.title),
      type: readString(record, 'type', fallback.type),
      location: readString(record, 'location', fallback.location),
      reportedBy: readString(reporter, 'full_name', fallback.reportedBy),
      date: readString(record, 'created_at', fallback.date),
      description: readString(record, 'description', fallback.description),
      status: statusFromLabel(status),
      severity: statusFromLabel(severity),
    };
  }

  private toClaim(value: unknown, index: number): ManagementClaim {
    const record = toRecord(value);
    const fallback = emptyClaim(index);
    const student = toRecord(record?.['student']);
    const group = toRecord(student?.['group']);
    const subject = toRecord(record?.['subject']);
    const status = readString(record, 'status', fallback.status.label);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      studentName: readString(student, 'full_name', fallback.studentName),
      group: readString(group, 'label', fallback.group),
      subject: readString(subject, 'name', fallback.subject),
      description: readString(record, 'description', fallback.description),
      evidenceUrl: readString(record, 'evidence_url', fallback.evidenceUrl),
      date: readString(record, 'created_at', fallback.date),
      status: statusFromLabel(status),
    };
  }

  private toLog(value: unknown, index: number, entity: ManagementAuditLog['entity']): ManagementAuditLog {
    const record = toRecord(value);
    const fallback = emptyLog(index, entity);
    const performedBy = toRecord(record?.['performed_by']);
    const action = readString(record, 'action', fallback.description);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      entity,
      date: readString(record, 'created_at', fallback.date),
      description: action,
      performedBy: readString(performedBy, 'full_name', fallback.performedBy),
      level: action.includes('DELETE') ? { label: 'WARN', tone: 'warning' } : { label: 'INFO', tone: 'neutral' },
    };
  }

  private toCharts(response: UnknownRecord, fallback: ManagementCharts): ManagementCharts {
    const general = toRecord(unwrapData(response['general']));
    const incidents = toRecord(unwrapData(response['incidents']));
    const absences = toRecord(unwrapData(response['absences']));
    const justifications = toRecord(toRecord(unwrapData(response['justifications']))?.['by_status']);

    return {
      totalStudents: readNumber(general, 'total_students', fallback.totalStudents),
      attendanceRate: readNumber(general, 'attendance_rate', fallback.attendanceRate),
      incidentsTotal: readNumber(incidents, 'total', fallback.incidentsTotal),
      absencesTotal: this.sumGroupedTotals(absences, fallback.absencesTotal),
      justifications: {
        approved: readNumber(justifications, 'ACEPTADO', fallback.justifications.approved),
        pending: readNumber(justifications, 'PENDIENTE', fallback.justifications.pending),
        rejected: readNumber(justifications, 'RECHAZADO', fallback.justifications.rejected),
      },
    };
  }

  private sumGroupedTotals(record: UnknownRecord | null, fallback: number): number {
    if (!record) {
      return fallback;
    }

    const groups = record['by_group'];

    if (!Array.isArray(groups)) {
      return fallback;
    }

    return groups.reduce((sum, item) => sum + readNumber(toRecord(item), 'total', 0), 0);
  }
}

function toRecord(value: unknown): UnknownRecord | null {
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : null;
}

function readString(record: UnknownRecord | null | undefined, key: string, fallback: string): string {
  const value = record?.[key];
  return typeof value === 'string' && value.trim().length ? value : fallback;
}

function readNumber(record: UnknownRecord | null | undefined, key: string, fallback: number): number {
  const value = record?.[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function readBoolean(record: UnknownRecord | null | undefined, key: string, fallback: boolean): boolean {
  const value = record?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

function readId(record: UnknownRecord | null | undefined, fallback: string): string {
  const value = record?.['id'];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function statusFromLabel(label: string) {
  const normalized = label.toLowerCase();

  if (
    normalized.includes('rechaz') ||
    normalized.includes('crit') ||
    normalized.includes('urgent') ||
    normalized.includes('falta') ||
    normalized.includes('offline')
  ) {
    return { label, tone: 'danger' as const };
  }

  if (
    normalized.includes('pend') ||
    normalized.includes('activo') ||
    normalized.includes('retardo') ||
    normalized.includes('proceso')
  ) {
    return { label, tone: 'warning' as const };
  }

  if (
    normalized.includes('acept') ||
    normalized.includes('aprob') ||
    normalized.includes('concl') ||
    normalized.includes('online') ||
    normalized.includes('asist')
  ) {
    return { label, tone: 'success' as const };
  }

  return { label, tone: 'neutral' as const };
}

function neutralStatus(label = 'Sin estado'): ManagementStatus {
  return { label, tone: 'neutral' };
}

function emptyGroup(index: number): ManagementGroup {
  return {
    id: String(index + 1),
    label: 'Grupo',
    career: 'Sin carrera',
    shift: 'Sin turno',
    studentCount: 0,
    attendanceRate: 0,
    tutor: 'Sin tutor asignado',
  };
}

function emptyStudent(index: number): ManagementStudent {
  return {
    id: String(index + 1),
    controlNumber: '',
    name: 'Alumno',
    group: '',
    career: '',
    email: '',
    phone: '',
    tutorName: '',
    status: neutralStatus(),
    attendanceRate: 0,
    level: '',
    avatarUrl: '/profile-avatar.svg',
    recentAttendance: [],
  };
}

function emptyTeacher(index: number): ManagementTeacher {
  return {
    id: String(index + 1),
    name: 'Profesor',
    employeeNumber: '',
    email: '',
    phone: '',
    career: '',
    activeGroups: [],
    subjects: [],
    status: neutralStatus(),
    schedulesCount: 0,
    avatarUrl: '/profile-avatar.svg',
  };
}

function emptySubject(index: number): ManagementSubject {
  return {
    id: String(index + 1),
    name: 'Materia',
    group: '',
    semester: '',
    teacher: '',
    schedule: '',
    classroom: '',
  };
}

function emptySchedule(index: number): ManagementSchedule {
  return {
    id: String(index + 1),
    day: '',
    time: '',
    subject: '',
    teacher: '',
    group: '',
    classroom: '',
  };
}

function emptyJustification(index: number): ManagementJustification {
  return {
    id: String(index + 1),
    studentId: '',
    studentName: '',
    subject: '',
    reason: '',
    date: '',
    submittedAt: '',
    status: neutralStatus(),
  };
}

function emptyDevice(index: number): ManagementDevice {
  return {
    id: String(index + 1),
    name: 'Dispositivo',
    macAddress: '',
    ipAddress: '',
    classroom: '',
    classroomId: '',
    building: '',
    tutor: '',
    status: neutralStatus(),
    lastSync: '',
  };
}

function emptyIncident(index: number): ManagementIncident {
  return {
    id: String(index + 1),
    title: 'Incidente',
    type: '',
    severity: neutralStatus(),
    status: neutralStatus(),
    location: '',
    reportedBy: '',
    date: '',
    description: '',
    evidenceUrl: '',
    roster: [],
    history: [],
  };
}

function emptyClaim(index: number): ManagementClaim {
  return {
    id: String(index + 1),
    studentId: '',
    studentName: '',
    group: '',
    subject: '',
    status: neutralStatus(),
    date: '',
    description: '',
    evidenceUrl: '',
    history: [],
  };
}

function emptyLog(index: number, entity: ManagementAuditLog['entity']): ManagementAuditLog {
  return {
    id: String(index + 1),
    entity,
    date: '',
    description: '',
    level: neutralStatus('INFO'),
    performedBy: '',
  };
}
