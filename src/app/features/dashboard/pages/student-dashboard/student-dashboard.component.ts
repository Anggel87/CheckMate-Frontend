import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/authentication/auth.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
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
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      @if (loading()) {
        <app-loading-spinner label="Cargando informacion del alumno" [showLabel]="true" />
      } @else {
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
          @for (metric of metrics(); track metric.label) {
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
            </header>

            @if (currentCourse()) {
              <div class="student-current-course__body">
                <span class="student-course-tile" aria-hidden="true">
                  <i [class]="currentCourse()!.icon"></i>
                </span>

                <div class="student-current-course__content">
                  <h3>{{ currentCourse()!.name }}</h3>
                  <p>{{ currentCourse()!.group }} - {{ currentCourse()!.teacher }}</p>
                  <small>
                    <i class="fa-regular fa-clock" aria-hidden="true"></i>
                    {{ currentCourse()!.schedule || 'Sin horario activo' }}
                    <span aria-hidden="true">-</span>
                    <i class="fa-regular fa-building" aria-hidden="true"></i>
                    {{ currentCourse()!.location || 'Sin aula asignada' }}
                  </small>
                </div>

                <div class="student-state-box" aria-label="Asistencia de la materia">
                  <span>Asistencia</span>
                  <app-status-badge
                    [label]="currentCourse()!.attendance + '%'"
                    [tone]="currentCourse()!.tone"
                  />
                </div>
              </div>
            } @else {
              <p class="dropdown-empty">No tienes materias activas.</p>
            }
          </article>

          <article class="student-card student-quick-actions">
            <h2>Accesos Rapidos</h2>

            <div class="student-action-list">
              @for (action of quickActions(); track action.route) {
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
      }
    </section>
  `,
})
export class StudentDashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly profile = signal<StudentProfileView>(EMPTY_STUDENT_PROFILE);
  protected readonly metrics = signal<StudentMetricView[]>([]);
  protected readonly currentCourse = signal<StudentCourseView | null>(null);
  protected readonly quickActions = signal<readonly StudentQuickAction[]>([]);

  constructor() {
    this.studentApi
      .getDashboard()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((dashboard) => {
        this.profile.set(dashboard.profile);
        this.metrics.set(dashboard.metrics);
        this.currentCourse.set(dashboard.currentCourse);
        this.quickActions.set(dashboard.quickActions);
        this.authService.updateProfileSummary(dashboard.profile.avatarUrl, dashboard.profile.shortName);
      });
  }

  protected firstName(): string {
    return this.profile().name.split(' ').filter(Boolean)[0] ?? 'Alumno';
  }
}
