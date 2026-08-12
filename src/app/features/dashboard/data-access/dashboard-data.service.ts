import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/authentication/auth.service';
import { UserRole } from '../../../core/enums/user-role.enum';
import {
  ManagementDataService,
} from '../../management/data-access/management-data.service';
import {
  TeacherClassView,
  TeacherPortalApiService,
  TeacherStudentView,
} from '../../teacher-portal/data-access/teacher-portal-api.service';

export interface DashboardMetric {
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  trend?: string;
}

export interface TodayClass {
  group: string;
  subject: string;
  time: string;
  status: 'active' | 'pending' | 'completed';
  scheduleId?: string;
}

export interface DashboardStudent {
  name: string;
  enrollment: string;
  status: 'present' | 'late' | 'absent' | 'pending';
  avatarUrl?: string;
}

export interface DashboardView {
  metrics: DashboardMetric[];
  todayClasses: TodayClass[];
  students: DashboardStudent[];
  nextClass: TodayClass | null;
}

const EMPTY_DASHBOARD: DashboardView = {
  metrics: [],
  todayClasses: [],
  students: [],
  nextClass: null,
};

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  private readonly authService = inject(AuthService);
  private readonly managementData = inject(ManagementDataService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  getDashboard(): Observable<DashboardView> {
    const role = this.authService.currentUser()?.role;

    if (role === UserRole.ADMIN || role === UserRole.CAREER_DIRECTOR) {
      return this.managementDashboard();
    }

    if (role === UserRole.TEACHER || role === UserRole.TUTOR_TEACHER) {
      return this.teacherDashboard();
    }

    return of(EMPTY_DASHBOARD);
  }

  private managementDashboard(): Observable<DashboardView> {
    return this.managementData.getSnapshot().pipe(
      map((snapshot): DashboardView => {
        const studentsTotal = snapshot.charts.totalStudents || snapshot.students.length;
        const pendingJustifications = snapshot.justifications.filter(
          (item) => item.status.tone === 'warning',
        ).length;
        const activeClaims = snapshot.claims.filter((item) => item.status.tone !== 'success').length;

        return {
          metrics: [
            {
              title: 'Alumnos registrados',
              value: String(studentsTotal),
              description: 'Desde la API',
              icon: 'fa-solid fa-user-graduate',
              tone: 'info',
            },
            {
              title: 'Grupos activos',
              value: String(snapshot.groups.length),
              description: 'Periodo actual',
              icon: 'fa-solid fa-users',
              tone: 'neutral',
            },
            {
              title: 'Asistencia general',
              value: `${snapshot.charts.attendanceRate}%`,
              description: 'Promedio disponible',
              icon: 'fa-solid fa-chart-line',
              tone: snapshot.charts.attendanceRate >= 90 ? 'success' : 'warning',
            },
            {
              title: 'Pendientes',
              value: String(pendingJustifications + activeClaims),
              description: 'Justificantes y reclamos',
              icon: 'fa-solid fa-inbox',
              tone: pendingJustifications + activeClaims > 0 ? 'warning' : 'success',
            },
          ],
          todayClasses: [],
          students: snapshot.students.slice(0, 5).map((student) => ({
            name: student.name,
            enrollment: student.controlNumber,
            status: student.status.tone === 'danger' ? 'absent' : 'present',
            avatarUrl: student.avatarUrl,
          })),
          nextClass: null,
        };
      }),
      catchError(() => of(EMPTY_DASHBOARD)),
    );
  }

  private teacherDashboard(): Observable<DashboardView> {
    return forkJoin({
      classes: this.teacherApi.getTodayClasses().pipe(catchError(() => of([]))),
      groups: this.teacherApi.getGroups().pipe(catchError(() => of([]))),
      incidents: this.teacherApi.getIncidents().pipe(catchError(() => of([]))),
    }).pipe(
      switchMap(({ classes, groups, incidents }) => {
        const firstGroupId = groups[0]?.id;
        const students$ = firstGroupId
          ? this.teacherApi.getGroupStudents(firstGroupId).pipe(catchError(() => of([])))
          : of([]);

        return students$.pipe(
          map((students) => this.toTeacherDashboard(classes, groups.length, incidents.length, students)),
        );
      }),
      catchError(() => of(EMPTY_DASHBOARD)),
    );
  }

  private toTeacherDashboard(
    classes: readonly TeacherClassView[],
    groupCount: number,
    incidentCount: number,
    students: readonly TeacherStudentView[],
  ): DashboardView {
    const todayClasses = classes.map((classItem) => ({
      group: classItem.group,
      subject: classItem.subject,
      time: `${classItem.start} - ${classItem.end}`,
      status:
        classItem.status === 'active'
          ? ('active' as const)
          : classItem.status === 'done'
            ? ('completed' as const)
            : ('pending' as const),
      scheduleId: classItem.scheduleId,
    }));

    return {
      metrics: [
        {
          title: 'Clases hoy',
          value: String(classes.length),
          description: 'Horarios activos',
          icon: 'fa-solid fa-calendar-days',
          tone: 'neutral',
        },
        {
          title: 'Grupos asignados',
          value: String(groupCount),
          description: 'Segun API',
          icon: 'fa-solid fa-users',
          tone: 'info',
        },
        {
          title: 'Alumnos visibles',
          value: String(students.length),
          description: 'Primer grupo cargado',
          icon: 'fa-solid fa-user-graduate',
          tone: 'success',
        },
        {
          title: 'Incidentes',
          value: String(incidentCount),
          description: 'Reportados por ti',
          icon: 'fa-solid fa-triangle-exclamation',
          tone: incidentCount > 0 ? 'warning' : 'neutral',
        },
      ],
      todayClasses,
      students: students.slice(0, 5).map((student) => ({
        name: student.name,
        enrollment: student.enrollment,
        status: student.attendance >= 90 ? 'present' : student.attendance >= 75 ? 'late' : 'absent',
        avatarUrl: student.avatarUrl,
      })),
      nextClass: todayClasses.find((classItem) => classItem.status === 'active' || classItem.status === 'pending') ?? null,
    };
  }
}
