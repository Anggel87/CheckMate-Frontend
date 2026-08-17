import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-students',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Alumnos tutorados</h1>
          <p>Busca, filtra y selecciona un alumno para revisar su seguimiento.</p>
        </div>

        <div class="teacher-filter-actions">
          <label class="tutor-search-control">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span class="sr-only">Buscar alumno</span>
            <input
              class="checkmate-input"
              type="search"
              placeholder="Nombre, matricula o grupo"
              (input)="search.set(inputValue($event))"
            />
          </label>
        </div>
      </header>

      @if (riskFilter()) {
        <div class="tutor-alert-card tutor-risk-banner">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <div>
            <h2>Filtrando por riesgo de inasistencia</h2>
            <p>Mostrando solo alumnos con 3 o mas faltas esta semana.</p>
          </div>
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="riskFilter.set(false)">
            Quitar filtro
          </button>
        </div>
      }

      <div class="teacher-tabs tutor-filter-tabs" aria-label="Filtro por grupo">
        <button
          type="button"
          [class.is-active]="activeGroup() === 'Todos'"
          (click)="activeGroup.set('Todos')"
        >
          Todos
        </button>
        @for (group of groups(); track group) {
          <button
            type="button"
            [class.is-active]="activeGroup() === group"
            (click)="activeGroup.set(group)"
          >
            Grupo {{ group }}
          </button>
        }
      </div>

      <section class="teacher-table-card" aria-label="Listado de alumnos tutorados">
        @if (filteredStudents().length === 0) {
          <app-empty-state
            icon="fa-solid fa-user-graduate"
            title="Sin alumnos"
            description="No se encontraron alumnos asociados a los filtros actuales."
          />
        } @else {
          <div class="teacher-table tutor-students-table">
            <div class="teacher-table__row teacher-table__row--header">
              <span>Alumno</span>
              <span>Grupo</span>
              <span>Asistencia</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>

            @for (student of filteredStudents(); track student.id) {
              <div class="teacher-table__row">
                <div class="teacher-person-cell">
                  @if (student.avatarUrl) {
                    <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
                  } @else {
                    <span class="avatar">{{ student.initials }}</span>
                  }
                  <div>
                    <strong>{{ student.name }}</strong>
                    <small>{{ student.enrollment }}</small>
                  </div>
                </div>
                <span>{{ student.group }} - {{ student.department }}</span>
                <div class="teacher-attendance-meter">
                  <div class="teacher-progress" aria-hidden="true">
                    <span
                      [class.is-warning]="student.attendanceRate < 90 && student.attendanceRate >= 80"
                      [class.is-danger]="student.attendanceRate < 80"
                      [style.width.%]="student.attendanceRate"
                    ></span>
                  </div>
                  <strong>{{ student.attendanceRate }}%</strong>
                </div>
                <app-status-badge [label]="student.status" [tone]="student.statusTone" />
                <div class="tutor-row-actions">
                  <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/tutor/students', student.id]">
                    Perfil
                  </a>
                  <a
                    class="btn-checkmate btn-checkmate-primary"
                    [routerLink]="['/tutor/students', student.id, 'attendance']"
                  >
                    Asistencias
                  </a>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </section>
  `,
})
export class TutorStudentsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly students = this.tutoringData.students;
  protected readonly search = signal('');
  protected readonly activeGroup = signal(this.route.snapshot.queryParamMap.get('group') ?? 'Todos');
  protected readonly riskFilter = signal(this.route.snapshot.queryParamMap.get('risk') === 'attendance');
  protected readonly groups = computed(() =>
    Array.from(new Set(this.students().map((student) => student.group))),
  );
  protected readonly filteredStudents = computed(() => {
    const term = this.search().trim().toLowerCase();
    const group = this.activeGroup();
    const atRiskIds = this.riskFilter()
      ? new Set(this.tutoringData.weeklyAbsenceAlerts().map((alert) => alert.student.id))
      : null;

    return this.students().filter((student) => {
      const matchesGroup = group === 'Todos' || student.group === group;
      const matchesRisk = atRiskIds === null || atRiskIds.has(student.id);
      const matchesTerm =
        term.length === 0 ||
        student.name.toLowerCase().includes(term) ||
        student.enrollment.toLowerCase().includes(term) ||
        student.group.toLowerCase().includes(term);

      return matchesGroup && matchesRisk && matchesTerm;
    });
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
