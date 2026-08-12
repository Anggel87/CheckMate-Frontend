import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  StudentCourseView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header">
        <div>
          <h1>Mis Materias</h1>
          <p>Consulta la informacion detallada de tus cursos actuales.</p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando materias..." [showLabel]="true" />
      } @else {
        <section class="student-subject-grid" aria-label="Materias actuales">
          @for (subject of subjects(); track subject.id) {
            <article class="student-card student-subject-card">
              <header>
                <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                  <i [class]="subject.icon"></i>
                </span>
                <span
                  class="student-subject-attendance"
                  [class]="'student-subject-attendance student-subject-attendance--' + subject.tone"
                >
                  {{ subject.attendance }}% Asistencia
                </span>
              </header>

              <h2>{{ subject.name }}</h2>
              <p>{{ subject.teacher }}</p>

              <dl>
                <div>
                  <dt><i class="fa-regular fa-clock" aria-hidden="true"></i></dt>
                  <dd>{{ subject.schedule }}</dd>
                </div>
                <div>
                  <dt><i class="fa-regular fa-building" aria-hidden="true"></i></dt>
                  <dd>{{ subject.location }}</dd>
                </div>
              </dl>

              <a class="student-card-link" [routerLink]="['/student/subjects', subject.id]"
                >Ver Detalles</a
              >
            </article>
          } @empty {
            <article class="student-card">
              <p class="dropdown-empty">No hay materias activas registradas en la API.</p>
            </article>
          }
        </section>
      }
    </section>
  `,
})
export class StudentSubjectsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(true);
  protected readonly subjects = signal<StudentCourseView[]>([]);

  constructor() {
    this.studentApi
      .getSubjects()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((subjects) => {
        this.subjects.set(subjects);
      });
  }
}
