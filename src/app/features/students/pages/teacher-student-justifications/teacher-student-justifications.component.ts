import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_TEACHER_STUDENT_PROFILE,
  TeacherJustificationHistoryView,
  TeacherPortalApiService,
  TeacherStudentProfileView,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-student-justifications',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      @if (loading()) {
        <app-loading-spinner label="Cargando justificantes..." [showLabel]="true" />
      } @else {
        <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
          <a routerLink="/teacher/groups">Mis grupos</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <a [routerLink]="['/teacher/students', student().id]">{{ student().fullName || 'Alumno' }}</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <strong>Justificantes</strong>
        </nav>

        <article class="teacher-student-inline-profile">
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().fullName" />
          <div>
            <h1>{{ student().fullName || 'Alumno' }}</h1>
            <p>Matricula: {{ student().enrollment }} - Grupo: {{ student().group }}</p>
          </div>
        </article>

        <section class="teacher-table-card" aria-label="Historial de justificantes">
          <header class="teacher-table-card__header">
            <h2>Historial de Justificantes</h2>
          </header>

          <div class="teacher-table teacher-justifications-table">
            <div class="teacher-table__row teacher-table__row--header">
              <span>Fecha</span>
              <span>Tipo</span>
              <span>Materia</span>
              <span>Evidencia</span>
              <span>Accion</span>
            </div>
            @for (record of records(); track record.id) {
              <div class="teacher-table__row">
                <span>{{ record.date }}</span>
                <app-status-badge [label]="record.type" [tone]="record.typeTone" />
                <span>{{ record.subject }}</span>
                <i [class]="record.evidenceIcon" aria-hidden="true"></i>
                <button
                  type="button"
                  class="icon-button"
                  [attr.aria-label]="'Ver justificante ' + record.date"
                >
                  <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
              </div>
            } @empty {
              <div class="teacher-table__row">
                <span>Sin justificantes expuestos por la API para este alumno.</span>
              </div>
            }
          </div>

          <footer class="teacher-table-footer">
            <span>Mostrando {{ records().length }} justificantes</span>
          </footer>
        </section>
      }
    </section>
  `,
})
export class TeacherStudentJustificationsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly student = signal<TeacherStudentProfileView>(EMPTY_TEACHER_STUDENT_PROFILE);
  protected readonly records = signal<TeacherJustificationHistoryView[]>([]);

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
      .getStudentJustifications(studentId)
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
}
