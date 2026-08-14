import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-student-attendance',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
        <a routerLink="/tutor/students">Alumnos tutorados</a>
        <span>/</span>
        <strong>{{ student().name }}</strong>
      </nav>

      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Asistencias de tu alumno</h1>
          <p>Historial de registros, faltas y retardos del alumno seleccionado.</p>
        </div>
        <div class="teacher-filter-actions">
          <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/tutor/students', student().id]">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Perfil
          </a>
          <a class="btn-checkmate btn-checkmate-primary" routerLink="/tutor/justifications/new">
            <i class="fa-solid fa-plus" aria-hidden="true"></i>
            Nuevo registro
          </a>
        </div>
      </header>

      <div class="tutor-attendance-layout">
        <aside class="teacher-side-stack">
          <section class="teacher-card tutor-student-aside">
            @if (student().avatarUrl) {
              <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
            } @else {
              <span class="avatar">{{ student().initials }}</span>
            }
            <h2>{{ student().name }}</h2>
            <p>Matricula: {{ student().enrollment }}</p>
            <dl>
              <div>
                <dt>Nivel</dt>
                <dd>{{ student().level }}</dd>
              </div>
              <div>
                <dt>Grupo</dt>
                <dd>{{ student().group }}</dd>
              </div>
              <div>
                <dt>Asistencia global</dt>
                <dd>{{ student().attendanceRate }}%</dd>
              </div>
            </dl>
          </section>

          <section class="teacher-card tutor-filter-card">
            <h2>Filtrar historial</h2>
            <label class="teacher-form-field" for="attendance-month">
              <span class="checkmate-label">Rango de fecha</span>
              <select id="attendance-month" class="checkmate-select">
                <option>Junio 2024</option>
                <option>Mayo 2024</option>
              </select>
            </label>
            <label class="teacher-form-field" for="attendance-status">
              <span class="checkmate-label">Estado de asistencia</span>
              <select id="attendance-status" class="checkmate-select" (change)="statusFilter.set(inputValue($event))">
                <option value="Todos">Todos los estados</option>
                <option value="A tiempo">A tiempo</option>
                <option value="Inasistencia">Inasistencia</option>
                <option value="Retardo">Retardo</option>
              </select>
            </label>
            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="statusFilter.set('Todos')">
              Limpiar filtros
            </button>
          </section>
        </aside>

        <section class="teacher-profile-main">
          <nav class="teacher-tabs tutor-subject-tabs" aria-label="Materias">
            <button type="button" class="is-active">Base de datos</button>
            <button type="button">Redes</button>
            <button type="button">Software</button>
          </nav>

          <div class="tutor-attendance-records">
            @for (record of filteredRecords(); track record.id) {
              <a
                class="teacher-card tutor-attendance-record"
                [class.is-danger]="record.status === 'Inasistencia'"
                [class.is-warning]="record.status === 'Retardo'"
                [routerLink]="['/tutor/students', student().id, 'attendance', record.id]"
              >
                <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                <div>
                  <strong>{{ record.status }}</strong>
                  <span>{{ record.date }} - {{ record.time }}</span>
                </div>
                <b>Aula<br />{{ record.classroom }}</b>
              </a>
            }
          </div>

          <footer class="student-table-footer">
            <span>Mostrando {{ filteredRecords().length }} registros</span>
            <div class="student-pagination" aria-label="Paginacion">
              <button type="button" disabled aria-label="Pagina anterior">
                <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button type="button" class="is-active" disabled>1</button>
              <button type="button" disabled aria-label="Pagina siguiente">
                <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </footer>
        </section>
      </div>
    </section>
  `,
})
export class TutorStudentAttendanceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly statusFilter = signal('Todos');
  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );
  protected readonly records = computed(() => this.tutoringData.attendanceForStudent(this.student().id));
  protected readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    return status === 'Todos'
      ? this.records()
      : this.records().filter((record) => record.status === status);
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
