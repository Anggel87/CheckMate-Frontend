import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StudentPortalApiService,
  StudentTeacherView,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-teachers',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header">
        <div>
          <h1>Mis Profesores</h1>
          <p>Consulta quien te imparte cada materia y sus datos de contacto.</p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando profesores..." [showLabel]="true" />
      } @else {
        <section class="student-subject-grid" aria-label="Profesores">
          @for (teacher of teachers(); track teacher.id) {
            <article class="student-card student-subject-card">
              <header>
                <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                  <i class="fa-solid fa-chalkboard-user"></i>
                </span>
                @if (teacher.isTutor) {
                  <app-status-badge label="Tu tutor" tone="info" icon="fa-solid fa-star" />
                }
              </header>

              <h2>{{ teacher.fullName }}</h2>
              <p>{{ teacher.email }}</p>

              <div class="student-subject-tag-list">
                @for (subject of teacher.subjects; track subject) {
                  <span class="student-subject-tag">{{ subject }}</span>
                }
              </div>

              <a class="student-card-link" [routerLink]="['/student/teachers', teacher.id]">Ver Detalles</a>
            </article>
          } @empty {
            <article class="student-card">
              <p class="dropdown-empty">No tienes profesores registrados todavia.</p>
            </article>
          }
        </section>
      }
    </section>
  `,
})
export class StudentTeachersComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(true);
  protected readonly teachers = signal<StudentTeacherView[]>([]);

  constructor() {
    this.studentApi
      .getTeachers()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((teachers) => {
        this.teachers.set(teachers);
      });
  }
}
