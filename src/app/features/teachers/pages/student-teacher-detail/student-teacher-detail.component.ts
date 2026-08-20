import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_STUDENT_TEACHER_DETAIL,
  StudentPortalApiService,
  StudentTeacherDetailView,
} from '../../../student-portal/data-access/student-portal-api.service';

const DAY_LABELS: Record<string, string> = {
  DOMINGO: 'Domingo',
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miercoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sabado',
};

@Component({
  selector: 'app-student-teacher-detail',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/teachers">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Mis Profesores
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando profesor..." [showLabel]="true" />
      } @else {
        <article class="student-card student-teacher-detail-card">
          <header>
            <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
              <i class="fa-solid fa-chalkboard-user"></i>
            </span>
            <div>
              <h1>{{ teacher().fullName }}</h1>
              <p><i class="fa-regular fa-envelope" aria-hidden="true"></i> {{ teacher().email }}</p>
            </div>
            @if (teacher().isTutor) {
              <app-status-badge label="Tu tutor" tone="info" icon="fa-solid fa-star" />
            }
          </header>

          <div class="student-subject-tag-list">
            @for (subject of teacher().subjects; track subject.id) {
              <span class="student-subject-tag">{{ subject.name }}</span>
            }
          </div>
        </article>

        <article class="student-card">
          <h2>Horario con este profesor</h2>

          <section class="teacher-schedule-list" aria-label="Clases con este profesor">
            @for (item of teacher().schedules; track item.scheduleId) {
              <article class="teacher-schedule-row">
                <div class="teacher-schedule-row__time">
                  <strong>{{ item.start }}</strong>
                  <span>{{ item.end }}</span>
                </div>

                <div class="teacher-schedule-row__content">
                  <div class="teacher-schedule-row__chips">
                    <span>{{ dayLabel(item.day) }}</span>
                    <span><i class="fa-regular fa-building" aria-hidden="true"></i> {{ item.classroom }}</span>
                  </div>
                  <h2>{{ item.subject }}</h2>
                </div>
              </article>
            } @empty {
              <p class="dropdown-empty">No hay horario registrado con este profesor.</p>
            }
          </section>
        </article>
      }
    </section>
  `,
})
export class StudentTeacherDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(true);
  protected readonly teacher = signal<StudentTeacherDetailView>(EMPTY_STUDENT_TEACHER_DETAIL);

  constructor() {
    this.studentApi
      .getTeacherDetail(this.route.snapshot.paramMap.get('teacherId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((teacher) => this.teacher.set(teacher));
  }

  protected dayLabel(day: string): string {
    return DAY_LABELS[day] ?? day;
  }
}
