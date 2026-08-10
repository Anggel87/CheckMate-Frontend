import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_STUDENT_PROFILE,
  StudentCourseView,
  StudentMetricView,
  StudentPortalApiService,
  StudentProfileView,
  StudentQuickAction,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--hero">
        <div>
          <h1>Hola, {{ firstName() }}.</h1>
          <p>Aqui tienes el resumen de tu actividad academica.</p>
        </div>
      </header>

      <section
        class="student-stat-grid student-stat-grid--three"
        aria-label="Resumen de asistencia"
      >
        @for (metric of metrics; track metric.label) {
          <article
            class="student-card student-metric-card"
            [class]="'student-card student-metric-card student-metric-card--' + metric.tone"
          >
            <div>
              <span class="student-metric-card__label">{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.trend ?? metric.detail }}</span>
            </div>
            <span class="student-icon-bubble" aria-hidden="true">
              <i [class]="metric.icon"></i>
            </span>
          </article>
        }
      </section>

      <section class="student-dashboard-grid">
        <article class="student-card student-current-course">
          <header>
            <h2>Materia Actual</h2>
            <app-status-badge label="API REAL" tone="info" icon="fa-solid fa-circle" />
          </header>

          @if (currentCourse) {
            <div class="student-current-course__body">
              <span class="student-course-tile" aria-hidden="true">
                <i [class]="currentCourse.icon"></i>
              </span>

              <div class="student-current-course__content">
                <h3>{{ currentCourse.name }}</h3>
                <p>{{ currentCourse.group }} - {{ currentCourse.teacher }}</p>
                <small>
                  <i class="fa-regular fa-clock" aria-hidden="true"></i>
                  {{ currentCourse.schedule || 'Sin horario activo' }}
                  <span aria-hidden="true">-</span>
                  <i class="fa-regular fa-building" aria-hidden="true"></i>
                  {{ currentCourse.location || 'Sin aula asignada' }}
                </small>
              </div>

              <div class="student-state-box" aria-label="Asistencia de la materia">
                <span>Asistencia</span>
                <app-status-badge [label]="currentCourse.attendance + '%'" [tone]="currentCourse.tone" />
              </div>
            </div>
          } @else {
            <p class="dropdown-empty">No hay materias activas registradas en la API.</p>
          }
        </article>

        <article class="student-card student-quick-actions">
          <h2>Accesos Rapidos</h2>

          <div class="student-action-list">
            @for (action of quickActions; track action.route) {
              <a class="student-action-row" [routerLink]="action.route">
                <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                  <i [class]="action.icon"></i>
                </span>
                <span>
                  <strong>{{ action.label }}</strong>
                  <small>{{ action.description }}</small>
                </span>
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            }
          </div>
        </article>
      </section>

      <a
        class="student-floating-action"
        [routerLink]="['/student/profile']"
        aria-label="Abrir perfil"
      >
        <img [src]="profile.avatarUrl" [alt]="'Foto de perfil de ' + profile.name" />
      </a>
    </section>
  `,
})
export class StudentDashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected profile: StudentProfileView = EMPTY_STUDENT_PROFILE;
  protected metrics: StudentMetricView[] = [];
  protected currentCourse: StudentCourseView | null = null;
  protected quickActions: readonly StudentQuickAction[] = [];

  constructor() {
    this.studentApi
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dashboard) => {
        this.profile = dashboard.profile;
        this.metrics = dashboard.metrics;
        this.currentCourse = dashboard.currentCourse;
        this.quickActions = dashboard.quickActions;
      });
  }

  protected firstName(): string {
    return this.profile.name.split(' ').filter(Boolean)[0] ?? 'Alumno';
  }
}
