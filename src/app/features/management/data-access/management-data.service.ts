import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/authentication/auth.service';
import { CheckmateApiService } from '../../../core/api/checkmate-api.service';
import { unwrapData } from '../../../core/api/api-adapter';
import { UserRole } from '../../../core/enums/user-role.enum';
import { apiErrorMessage } from '../../../shared/utils/api-error.util';
import {
  AttendanceSettingFormPayload,
  CareerFormPayload,
  DeviceCreatePayload,
  EMPTY_MANAGEMENT_SNAPSHOT,
  IncidentCreatePayload,
  IncidentRosterStatus,
  ManagementActionResult,
  ManagementAttendanceSetting,
  ManagementAuditLog,
  ManagementCareer,
  ManagementCareerDirector,
  ManagementCharts,
  ManagementClaim,
  ManagementClassroom,
  ManagementDevice,
  ManagementGroup,
  ManagementIncident,
  ManagementIncidentHistoryItem,
  ManagementIncidentRosterItem,
  ManagementJustification,
  ManagementSchedule,
  ManagementSchoolYear,
  ManagementSnapshot,
  ManagementStatus,
  ManagementStudent,
  ManagementSubject,
  ManagementTeacher,
  ManagementTutor,
  ScheduleFormPayload,
  SchoolYearFormPayload,
} from '../models/management.model';

type UnknownRecord = Record<string, unknown>;

export interface ManagementStudentActionResult {
  success: boolean;
  message: string | null;
  student: ManagementStudent | null;
}

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
            // Audit logs are only relevant on the audit screens, not on every management page
            // load — fetched on demand per entity by the workspace component instead.
            logs: of([] as ManagementAuditLog[]),
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
    if (!this.isDirectorOrAdmin()) {
      return of([]);
    }

    return groupId
      ? this.checkmateApi.getCollection(`${this.scopeBase()}/groups/${groupId}/schedule`, (item, index) =>
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
    if (!this.isDirectorOrAdmin()) {
      return of([]);
    }

    return studentId
      ? this.checkmateApi.getCollection(
          `${this.scopeBase()}/students/${studentId}/justifications`,
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
    if (!this.isDirectorOrAdmin()) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.scopeBase()}/incidents`, (item, index) =>
      this.toIncident(item, index),
    );
  }

  getIncident(incidentId: string): Observable<ManagementIncident> {
    return this.checkmateApi.get<unknown>(`${this.scopeBase()}/incidents/${incidentId}`).pipe(
      map((response) => this.toIncident(unwrapData(response), 0)),
    );
  }

  getGroupSchedule(groupId: string): Observable<ManagementSchedule[]> {
    return this.checkmateApi.getCollection(`${this.scopeBase()}/groups/${groupId}/schedule`, (item, index) =>
      this.toSchedule(item, index),
    );
  }

  getGroupStudentsForIncident(groupId: string): Observable<ManagementStudent[]> {
    return this.checkmateApi.getCollection(`${this.scopeBase()}/groups/${groupId}/students`, (item, index) =>
      this.toStudent(item, index),
    );
  }

  /**
   * Full schedule CRUD only exists for admin (see ManagementDataService's `getGroupSchedule`
   * for the read-only per-group view directors use instead).
   */
  getSchedules(): Observable<ManagementSchedule[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/schedules`, (item, index) =>
      this.toSchedule(item, index),
    );
  }

  getSchedule(scheduleId: string): Observable<ManagementSchedule> {
    return this.checkmateApi.get<unknown>(`${this.adminBase()}/schedules/${scheduleId}`).pipe(
      map((response) => this.toSchedule(unwrapData(response), 0)),
    );
  }

  createSchedule(payload: ScheduleFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.post<unknown>(`${this.adminBase()}/schedules`, this.scheduleRequestBody(payload)).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  updateSchedule(scheduleId: string, payload: ScheduleFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/schedules/${scheduleId}`, this.scheduleRequestBody(payload))
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  deactivateSchedule(scheduleId: string): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.delete<unknown>(`${this.adminBase()}/schedules/${scheduleId}`, { confirm: true }).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  getSchoolYears(): Observable<ManagementSchoolYear[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/school-years`, (item, index) =>
      this.toSchoolYear(item, index),
    );
  }

  getSchoolYear(schoolYearId: string): Observable<ManagementSchoolYear> {
    return this.checkmateApi.get<unknown>(`${this.adminBase()}/school-years/${schoolYearId}`).pipe(
      map((response) => this.toSchoolYear(unwrapData(response), 0)),
    );
  }

  createSchoolYear(payload: SchoolYearFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .post<unknown>(`${this.adminBase()}/school-years`, {
        name: payload.name,
        start_date: payload.startDate,
        end_date: payload.endDate,
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateSchoolYear(schoolYearId: string, payload: SchoolYearFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/school-years/${schoolYearId}`, {
        name: payload.name,
        start_date: payload.startDate,
        end_date: payload.endDate,
        ...(payload.status ? { status: payload.status } : {}),
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  getCareers(): Observable<ManagementCareer[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/careers?include_inactive=true`, (item, index) =>
      this.toCareer(item, index),
    );
  }

  getCareer(careerId: string): Observable<ManagementCareer> {
    return this.checkmateApi
      .get<unknown>(`${this.adminBase()}/careers/${careerId}`)
      .pipe(map((response) => this.toCareer(unwrapData(response), 0)));
  }

  getCareerDirectors(): Observable<ManagementCareerDirector[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/users/permissions`, (item) => this.toCareerDirector(item)).pipe(
      map((users) => users.filter((user): user is ManagementCareerDirector => user !== null)),
    );
  }

  createCareer(payload: CareerFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.post<unknown>(`${this.adminBase()}/careers`, this.careerRequestBody(payload)).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  updateCareer(careerId: string, payload: CareerFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/careers/${careerId}`, this.careerRequestBody(payload))
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  deactivateCareer(careerId: string): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.delete<unknown>(`${this.adminBase()}/careers/${careerId}`, { confirm: true }).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  reactivateCareer(careerId: string): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.put<unknown>(`${this.adminBase()}/careers/${careerId}`, { is_active: true }).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  private careerRequestBody(payload: CareerFormPayload): UnknownRecord {
    return {
      name: payload.name,
      short_name: payload.shortName || null,
      code: payload.code,
      director_id: Number(payload.directorId),
    };
  }

  private toCareer(value: unknown, index: number): ManagementCareer {
    const record = toRecord(value);
    const fallback = emptyCareer(index);
    const director = toRecord(record?.['director']);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      name: readString(record, 'name', fallback.name),
      shortName: readString(record, 'short_name', fallback.shortName),
      code: readString(record, 'code', fallback.code),
      isActive: readBoolean(record, 'is_active', fallback.isActive),
      directorId: readIdField(director, 'id', fallback.directorId),
      directorName: readString(director, 'full_name', fallback.directorName),
      groupsCount: readNumber(record, 'groups_count', fallback.groupsCount),
    };
  }

  private toCareerDirector(value: unknown): ManagementCareerDirector | null {
    const record = toRecord(value);

    if (readString(record, 'role', '') !== 'director_carrera') {
      return null;
    }

    return {
      id: readId(record, ''),
      fullName: readString(record, 'full_name', ''),
    };
  }

  getAttendanceSettings(): Observable<ManagementAttendanceSetting[]> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.adminBase()}/attendance-settings`, (item, index) =>
      this.toAttendanceSetting(item, index),
    );
  }

  getAttendanceSetting(attendanceSettingId: string): Observable<ManagementAttendanceSetting> {
    return this.checkmateApi
      .get<unknown>(`${this.adminBase()}/attendance-settings/${attendanceSettingId}`)
      .pipe(map((response) => this.toAttendanceSetting(unwrapData(response), 0)));
  }

  createAttendanceSetting(payload: AttendanceSettingFormPayload): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .post<unknown>(`${this.adminBase()}/attendance-settings`, this.attendanceSettingRequestBody(payload))
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateAttendanceSetting(
    attendanceSettingId: string,
    payload: AttendanceSettingFormPayload,
  ): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(
        `${this.adminBase()}/attendance-settings/${attendanceSettingId}`,
        this.attendanceSettingRequestBody(payload),
      )
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  deactivateAttendanceSetting(attendanceSettingId: string): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi.delete<unknown>(`${this.adminBase()}/attendance-settings/${attendanceSettingId}`).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  reactivateAttendanceSetting(attendanceSettingId: string): Observable<ManagementActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.' });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/attendance-settings/${attendanceSettingId}`, { is_active: true })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  private attendanceSettingRequestBody(payload: AttendanceSettingFormPayload): UnknownRecord {
    return {
      schedule_id: Number(payload.scheduleId),
      present_tolerance_minutes: Number(payload.presentToleranceMinutes),
      late_tolerance_minutes: Number(payload.lateToleranceMinutes),
      allow_manual_attendance: payload.allowManualAttendance,
    };
  }

  private toAttendanceSetting(value: unknown, index: number): ManagementAttendanceSetting {
    const record = toRecord(value);
    const fallback = emptyAttendanceSetting(index);
    const schedule = toRecord(record?.['schedule']);
    const scheduleLabel = schedule
      ? `${readString(schedule, 'subject', '')} - ${readString(schedule, 'group', '')} (${readString(schedule, 'day_of_week', '')} ${readString(schedule, 'start_time', '')}-${readString(schedule, 'end_time', '')})`
      : fallback.scheduleLabel;

    return {
      ...fallback,
      id: readId(record, fallback.id),
      scheduleId: readIdField(record, 'schedule_id', fallback.scheduleId),
      scheduleLabel,
      presentToleranceMinutes: readNumber(record, 'present_tolerance_minutes', fallback.presentToleranceMinutes),
      lateToleranceMinutes: readNumber(record, 'late_tolerance_minutes', fallback.lateToleranceMinutes),
      allowManualAttendance: readBoolean(record, 'allow_manual_attendance', fallback.allowManualAttendance),
      isActive: readBoolean(record, 'is_active', fallback.isActive),
    };
  }

  private toSchoolYear(value: unknown, index: number): ManagementSchoolYear {
    const record = toRecord(value);

    return {
      id: readId(record, String(index + 1)),
      name: readString(record, 'name', ''),
      startDate: readString(record, 'start_date', ''),
      endDate: readString(record, 'end_date', ''),
      status: readString(record, 'status', 'PROXIMO'),
      groupsCount: readNumber(record, 'groups_count', 0),
    };
  }

  private scheduleRequestBody(payload: ScheduleFormPayload): UnknownRecord {
    return {
      school_year_id: Number(payload.schoolYearId),
      group_id: Number(payload.groupId),
      subject_id: Number(payload.subjectId),
      teacher_id: Number(payload.teacherId),
      classroom_id: Number(payload.classroomId),
      day_of_week: payload.dayOfWeek,
      start_time: payload.startTime,
      end_time: payload.endTime,
    };
  }

  getClaims(): Observable<ManagementClaim[]> {
    if (this.isDirectorOrAdmin()) {
      return this.checkmateApi.getCollection(`${this.scopeBase()}/claims`, (item, index) =>
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
    if (!this.isDirectorOrAdmin()) {
      return of([]);
    }

    return this.checkmateApi.getCollection(`${this.scopeBase()}/logs/${entity}`, (item, index) =>
      this.toLog(item, index, entity),
    );
  }

  getCharts(): Observable<ManagementCharts> {
    if (!this.isDirectorOrAdmin()) {
      return of(EMPTY_MANAGEMENT_SNAPSHOT.charts);
    }

    return this.checkmateApi.get<unknown>(`${this.scopeBase()}/charts/summary`).pipe(
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
    formData.set('schedule_id', payload.scheduleId);
    payload.studentIds.forEach((studentId) => formData.append('student_ids[]', studentId));

    if (payload.evidence) {
      formData.set('evidence', payload.evidence);
    }

    return this.checkmateApi.post<unknown>(`${this.scopeBase()}/incidents`, formData).pipe(
      map(() => ({ success: true, message: null })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
    );
  }

  closeIncident(incidentId: string, resolution: string): Observable<ManagementActionResult> {
    return this.checkmateApi
      .post<unknown>(`${this.scopeBase()}/incidents/${incidentId}/close`, { resolution })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateIncidentStudents(incidentId: string, roster: ManagementIncidentRosterItem[]): Observable<ManagementActionResult> {
    return this.checkmateApi
      .patch<unknown>(`${this.scopeBase()}/incidents/${incidentId}/students`, {
        students: roster.map((item) => ({
          student_id: item.studentId,
          status: item.status,
          notes: item.notes || undefined,
        })),
      })
      .pipe(
        map(() => ({ success: true, message: null })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null })),
      );
  }

  updateClaimAction(claimId: string, action: string, comment: string): Observable<ManagementActionResult> {
    const base = this.currentRole() === UserRole.TUTOR_TEACHER ? this.tutorBase() : this.scopeBase();
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

  updateStudent(
    studentId: string,
    payload: { phone?: string; address?: string; active?: boolean; photo?: File | null },
  ): Observable<ManagementStudentActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.', student: null });
    }

    const formData = new FormData();
    // PHP no parsea multipart/form-data en peticiones PUT (solo en POST), asi que
    // se manda como POST con _method=PUT (method spoofing) para que la foto llegue.
    formData.set('_method', 'PUT');

    if (payload.phone !== undefined) {
      formData.set('phone', payload.phone);
    }

    if (payload.address !== undefined) {
      formData.set('address', payload.address);
    }

    if (payload.active !== undefined) {
      formData.set('active', payload.active ? '1' : '0');
    }

    if (payload.photo) {
      formData.set('photo', payload.photo);
    }

    return this.checkmateApi.post<unknown>(`${this.adminBase()}/students/${studentId}`, formData).pipe(
      map((response) => ({ success: true, message: null, student: this.toStudent(unwrapData(response), 0) })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null, student: null })),
    );
  }

  addStudentTutor(
    studentId: string,
    payload: { firstName: string; firstSurname: string; secondSurname: string; phone: string; relationship: string; isPrimary: boolean },
  ): Observable<ManagementStudentActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.', student: null });
    }

    return this.checkmateApi
      .post<unknown>(`${this.adminBase()}/students/${studentId}/tutors`, {
        first_name: payload.firstName,
        first_surname: payload.firstSurname,
        second_surname: payload.secondSurname,
        phone: payload.phone,
        relationship: payload.relationship,
        is_primary: payload.isPrimary,
      })
      .pipe(
        map((response) => ({ success: true, message: null, student: this.toStudent(unwrapData(response), 0) })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null, student: null })),
      );
  }

  updateStudentTutor(
    studentId: string,
    tutorId: string,
    payload: { phone?: string; relationship?: string; isPrimary?: boolean },
  ): Observable<ManagementStudentActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.', student: null });
    }

    return this.checkmateApi
      .put<unknown>(`${this.adminBase()}/students/${studentId}/tutors/${tutorId}`, {
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.relationship !== undefined ? { relationship: payload.relationship } : {}),
        ...(payload.isPrimary !== undefined ? { is_primary: payload.isPrimary } : {}),
      })
      .pipe(
        map((response) => ({ success: true, message: null, student: this.toStudent(unwrapData(response), 0) })),
        catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null, student: null })),
      );
  }

  removeStudentTutor(studentId: string, tutorId: string): Observable<ManagementStudentActionResult> {
    if (this.currentRole() !== UserRole.ADMIN) {
      return of({ success: false, message: 'No tienes permiso para esta accion.', student: null });
    }

    return this.checkmateApi.delete<unknown>(`${this.adminBase()}/students/${studentId}/tutors/${tutorId}`).pipe(
      map((response) => ({ success: true, message: null, student: this.toStudent(unwrapData(response), 0) })),
      catchError((error) => of({ success: false, message: apiErrorMessage(error, '') || null, student: null })),
    );
  }

  private scopeBase(): string {
    return this.currentRole() === UserRole.CAREER_DIRECTOR ? this.directorBase() : this.adminBase();
  }

  private isDirectorOrAdmin(): boolean {
    return this.currentRole() === UserRole.CAREER_DIRECTOR || this.currentRole() === UserRole.ADMIN;
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
      schoolYearId: readIdField(record, 'school_year_id', fallback.schoolYearId),
    };
  }

  private toStudent(value: unknown, index: number): ManagementStudent {
    const record = toRecord(value);
    const fallback = emptyStudent(index);
    const group = toRecord(record?.['group']);
    const career = toRecord(group?.['career']);
    const tutors = Array.isArray(record?.['tutors'])
      ? (record?.['tutors'] as unknown[]).map((item) => this.toTutor(item))
      : fallback.tutors;

    return {
      ...fallback,
      id: readId(record, fallback.id),
      controlNumber: readString(record, 'control_number', fallback.controlNumber),
      name: readString(record, 'full_name', readString(record, 'name', fallback.name)),
      group: readString(group, 'label', fallback.group),
      career: readString(career, 'name', fallback.career),
      email: readString(record, 'email', fallback.email),
      phone: readString(record, 'phone', fallback.phone),
      address: readString(record, 'address', fallback.address),
      avatarUrl: readString(record, 'photo_url', fallback.avatarUrl),
      tutors,
      tutorName: tutors.find((tutor) => tutor.isPrimary)?.fullName || tutors[0]?.fullName || fallback.tutorName,
      attendanceRate: readNumber(record, 'attendance_rate', fallback.attendanceRate),
      status: readBoolean(record, 'active', true)
        ? { label: 'Activo', tone: 'success' }
        : { label: 'Inactivo', tone: 'neutral' },
    };
  }

  private toTutor(value: unknown): ManagementTutor {
    const record = toRecord(value);

    return {
      id: readId(record, ''),
      fullName: readString(record, 'full_name', ''),
      phone: readString(record, 'phone', ''),
      relationship: readString(record, 'relationship', ''),
      isPrimary: readBoolean(record, 'is_primary', false),
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

  /**
   * Reused by two different backend shapes: the per-group read-only schedule (`schedule_id`,
   * no `group`/`school_year_id`) and the admin's global schedule CRUD (`id`, full `group`
   * object, `school_year_id`, `is_active`) — the raw-id fields simply stay empty/false when
   * fed the narrower per-group shape, which is fine since only the CRUD list needs them.
   */
  private toSchedule(value: unknown, index: number): ManagementSchedule {
    const record = toRecord(value);
    const fallback = emptySchedule(index);
    const subject = toRecord(record?.['subject']);
    const teacher = toRecord(record?.['teacher']);
    const classroom = toRecord(record?.['classroom']);
    const group = toRecord(record?.['group']);
    const startTime = readString(record, 'start_time', fallback.startTime);
    const endTime = readString(record, 'end_time', fallback.endTime);

    return {
      ...fallback,
      id: readId(record, readIdField(record, 'schedule_id', fallback.id)),
      day: readString(record, 'day_of_week', fallback.day),
      time: `${startTime || fallback.time.split(' - ')[0] || ''} - ${endTime || fallback.time.split(' - ')[1] || ''}`,
      subject: readString(subject, 'name', fallback.subject),
      teacher: readString(teacher, 'full_name', fallback.teacher),
      classroom: readString(classroom, 'name', fallback.classroom),
      group: readString(group, 'label', fallback.group),
      schoolYearId: readIdField(record, 'school_year_id', fallback.schoolYearId),
      groupId: readIdField(group, 'id', fallback.groupId),
      subjectId: readIdField(subject, 'id', fallback.subjectId),
      teacherId: readIdField(teacher, 'id', fallback.teacherId),
      classroomId: readIdField(classroom, 'id', fallback.classroomId),
      startTime,
      endTime,
      isActive: readBoolean(record, 'is_active', fallback.isActive),
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
    const groups = Array.isArray(record?.['groups']) ? (record?.['groups'] as unknown[]) : [];
    const students = Array.isArray(record?.['students']) ? (record?.['students'] as unknown[]) : [];
    const history = Array.isArray(record?.['history']) ? (record?.['history'] as unknown[]) : [];
    const status = readString(record, 'status', fallback.status.label);
    const severity = readString(record, 'severity', fallback.severity.label);

    return {
      ...fallback,
      id: readId(record, fallback.id),
      title: readString(record, 'title', fallback.title),
      type: readString(record, 'type', fallback.type),
      groups: groups.map((item) => this.groupLabel(toRecord(item))),
      reportedBy: readString(reporter, 'full_name', fallback.reportedBy),
      date: formatDateLabel(readString(record, 'created_at', fallback.date)),
      description: readString(record, 'description', fallback.description),
      evidenceUrl: readString(record, 'evidence_url', fallback.evidenceUrl),
      status: statusFromLabel(status),
      severity: statusFromLabel(severity),
      roster: students.length ? students.map((item) => this.toIncidentRosterItem(item)) : fallback.roster,
      history: history.length ? history.map((item) => this.toIncidentHistoryItem(item)) : fallback.history,
    };
  }

  private toIncidentRosterItem(value: unknown): ManagementIncidentRosterItem {
    const record = toRecord(value);
    const rawStatus = readString(record, 'status', '');
    const validStatuses: IncidentRosterStatus[] = ['DESCONOCIDO', 'PRESENTE', 'EXTRAVIADO', 'AUSENTE', 'SEGURO'];
    const status = (validStatuses as string[]).includes(rawStatus)
      ? (rawStatus as IncidentRosterStatus)
      : 'DESCONOCIDO';

    return {
      studentId: readId(record, ''),
      name: readString(record, 'full_name', ''),
      controlNumber: readString(record, 'control_number', ''),
      status,
      notes: readString(record, 'notes', ''),
    };
  }

  private toIncidentHistoryItem(value: unknown): ManagementIncidentHistoryItem {
    const record = toRecord(value);
    const performedBy = toRecord(record?.['performed_by']);

    return {
      id: readId(record, ''),
      date: formatDateLabel(readString(record, 'created_at', '')),
      description: readString(record, 'action', ''),
      actor: readString(performedBy, 'full_name', ''),
    };
  }

  private groupLabel(record: UnknownRecord | null): string {
    const grade = readString(record, 'grade', '');
    const section = readString(record, 'section', '');
    return [grade, section].filter(Boolean).join('-');
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
  return readIdField(record, 'id', fallback);
}

function readIdField(record: UnknownRecord | null | undefined, key: string, fallback: string): string {
  const value = record?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : fallback;
}

function formatDateLabel(value: string): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
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
    normalized.includes('resuelt') ||
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
    schoolYearId: '',
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
    address: '',
    tutorName: '',
    tutors: [],
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
    schoolYearId: '',
    groupId: '',
    subjectId: '',
    teacherId: '',
    classroomId: '',
    startTime: '',
    endTime: '',
    isActive: true,
  };
}

function emptyCareer(index: number): ManagementCareer {
  return {
    id: String(index + 1),
    name: 'Carrera',
    shortName: '',
    code: '',
    isActive: true,
    directorId: '',
    directorName: 'Sin director asignado',
    groupsCount: 0,
  };
}

function emptyAttendanceSetting(index: number): ManagementAttendanceSetting {
  return {
    id: String(index + 1),
    scheduleId: '',
    scheduleLabel: 'Horario',
    presentToleranceMinutes: 0,
    lateToleranceMinutes: 0,
    allowManualAttendance: true,
    isActive: true,
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
    groups: [],
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
