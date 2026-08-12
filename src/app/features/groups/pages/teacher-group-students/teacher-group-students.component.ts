import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  TeacherPortalApiService,
  TeacherStudentView,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-group-students',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Alumnos del Grupo</h1>
          <p>Listado obtenido desde la API.</p>
        </div>

        <div class="teacher-filter-actions">
          <button type="button" class="teacher-filter-button">
            Status: Todos
            <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-primary">
            <i class="fa-solid fa-download" aria-hidden="true"></i>
            Exportar
          </button>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando alumnos..." [showLabel]="true" />
      } @else {
        <section class="teacher-table-card" aria-label="Alumnos del grupo">
          <div class="teacher-table teacher-students-table">
            <div class="teacher-table__row teacher-table__row--header">
              <span>Alumno</span>
              <span>Matricula</span>
              <span>Asistencia</span>
              <span>Estado</span>
              <span>Accion</span>
            </div>

            @for (student of students(); track student.id) {
              <div class="teacher-table__row">
                <div class="teacher-person-cell">
                  @if (student.avatarUrl) {
                    <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
                  } @else {
                    <span class="avatar">{{ initials(student.name) }}</span>
                  }
                  <div>
                    <strong>{{ student.name }}</strong>
                    <small>{{ student.email }}</small>
                  </div>
                </div>
                <span>{{ student.enrollment }}</span>
                <div class="teacher-attendance-meter">
                  <div class="teacher-progress" aria-hidden="true">
                    <span
                      [class.is-warning]="student.attendance < 85 && student.attendance >= 70"
                      [class.is-danger]="student.attendance < 70"
                      [style.width.%]="student.attendance"
                    ></span>
                  </div>
                  <strong>{{ student.attendance }}%</strong>
                </div>
                <app-status-badge [label]="student.status" [tone]="student.statusTone" />
                <a
                  class="btn-checkmate btn-checkmate-secondary"
                  [routerLink]="['/teacher/students', student.id]"
                >
                  Ver Perfil
                </a>
              </div>
            } @empty {
              <div class="teacher-table__row">
                <span>No hay alumnos activos para este grupo.</span>
              </div>
            }
          </div>
        </section>
      }
    </section>
  `,
})
export class TeacherGroupStudentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly students = signal<TeacherStudentView[]>([]);

  constructor() {
    this.teacherApi
      .getGroupStudents(this.route.snapshot.paramMap.get('groupId') ?? '')
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((students) => {
        this.students.set(students);
      });
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
