import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_TEACHER_STUDENT_PROFILE,
  TeacherAttendanceHistoryView,
  TeacherPortalApiService,
  TeacherStudentProfileView,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-student-attendance',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      @if (loading()) {
        <app-loading-spinner label="Cargando asistencias..." [showLabel]="true" />
      } @else {
        <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
          <a routerLink="/teacher/groups">Tus grupos</a>
          <span>/</span>
          <strong>{{ student().fullName || 'Alumno' }}</strong>
        </nav>

        <article class="teacher-card teacher-student-summary-strip">
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().fullName" />
          <div>
            <h1>{{ student().fullName || 'Alumno' }}</h1>
            <p><i class="fa-regular fa-id-card"></i> ID: {{ student().enrollment }} <span>{{ student().group }}</span></p>
          </div>
          <div>
            <a class="btn-checkmate btn-checkmate-secondary" [href]="'mailto:' + student().email">
              <i class="fa-regular fa-envelope" aria-hidden="true"></i>
              Contactar
            </a>
          </div>
        </article>

        <section class="teacher-stats-grid">
          <article class="teacher-stat-card">
            <span>Total asistencias</span>
            <strong>{{ records().length }}</strong>
            <i class="fa-regular fa-circle-check is-success" aria-hidden="true"></i>
          </article>
          <article class="teacher-stat-card">
            <span>Inasistencias</span>
            <strong>{{ absentCount() }}</strong>
            <i class="fa-regular fa-circle-xmark is-danger" aria-hidden="true"></i>
          </article>
          <article class="teacher-stat-card">
            <span>Retardos</span>
            <strong>{{ lateCount() }}</strong>
            <i class="fa-regular fa-clock is-warning" aria-hidden="true"></i>
          </article>
        </section>

        <section class="teacher-table-card" aria-label="Historial de asistencias">
          <header class="teacher-table-card__header">
            <h2>Historial de Asistencias</h2>
          </header>

          <div class="teacher-table teacher-history-table">
            <div class="teacher-table__row teacher-table__row--header">
              <span>Fecha</span>
              <span>Materia</span>
              <span>Hora</span>
              <span>Estado</span>
              <span>Accion</span>
            </div>
            @for (record of records(); track record.id) {
              <div class="teacher-table__row">
                <span>{{ record.date }}</span>
                <span>{{ record.subject }}</span>
                <span>{{ record.time }}</span>
                <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                <button
                  type="button"
                  class="icon-button"
                  [attr.aria-label]="'Ver asistencia ' + record.date"
                >
                  <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
              </div>
            } @empty {
              <div class="teacher-table__row">
                <span>Sin registros de asistencia para este alumno.</span>
              </div>
            }
          </div>

          <footer class="teacher-table-footer">
            <span>Mostrando {{ records().length }} asistencias</span>
          </footer>
        </section>
      }
    </section>
  `,
})
export class TeacherStudentAttendanceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly student = signal<TeacherStudentProfileView>(EMPTY_TEACHER_STUDENT_PROFILE);
  protected readonly records = signal<TeacherAttendanceHistoryView[]>([]);

  private pendingRequests = 2;

  constructor() {
    const studentId = this.route.snapshot.paramMap.get('studentId');

    this.teacherApi
      .getStudentProfile(studentId)
      .pipe(
        finalize(() => this.markRequestComplete()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((student) => {
        this.student.set(student);
      });

    this.teacherApi
      .getStudentAttendance(studentId)
      .pipe(
        finalize(() => this.markRequestComplete()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((records) => {
        this.records.set(records);
      });
  }

  private markRequestComplete(): void {
    this.pendingRequests -= 1;

    if (this.pendingRequests <= 0) {
      this.loading.set(false);
    }
  }

  protected absentCount(): number {
    return this.records().filter((record) => record.statusTone === 'absent').length;
  }

  protected lateCount(): number {
    return this.records().filter((record) => record.statusTone === 'late').length;
  }
}
