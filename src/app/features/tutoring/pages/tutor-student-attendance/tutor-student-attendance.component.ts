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
            <p>ID: {{ student().enrollment }}</p>
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
            <label class="teacher-form-field" for="attendance-status">
              <span class="checkmate-label">Estado de asistencia</span>
              <select id="attendance-status" class="checkmate-select" (change)="statusFilter.set(inputValue($event))">
                <option value="Todos">Todos los estados</option>
                <option value="A tiempo">A tiempo</option>
                <option value="Inasistencia">Inasistencia</option>
                <option value="Retardo">Retardo</option>
                <option value="Justificado">Justificado</option>
              </select>
            </label>
            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="statusFilter.set('Todos')">
              Limpiar filtros
            </button>
          </section>
        </aside>

        <section class="teacher-profile-main">
          @if (subjects().length > 1) {
            <nav class="teacher-tabs tutor-subject-tabs" aria-label="Materias">
              <button type="button" [class.is-active]="subjectFilter() === 'Todas'" (click)="subjectFilter.set('Todas')">
                Todas
              </button>
              @for (subject of subjects(); track subject) {
                <button type="button" [class.is-active]="subjectFilter() === subject" (click)="subjectFilter.set(subject)">
                  {{ subject }}
                </button>
              }
            </nav>
          }

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
                  <strong>{{ record.subject }}</strong>
                  <span>{{ record.date }} - {{ record.time }}</span>
                </div>
              </a>
            } @empty {
              <p class="dropdown-empty">No hay registros de asistencia para este filtro.</p>
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
  protected readonly subjectFilter = signal('Todas');
  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );

  constructor() {
    const studentId = this.route.snapshot.paramMap.get('studentId');

    if (studentId) {
      this.tutoringData.loadStudentAttendance(studentId);
    }
  }
  protected readonly records = computed(() => this.tutoringData.attendanceForStudent(this.student().id));
  protected readonly subjects = computed(() =>
    Array.from(new Set(this.records().map((record) => record.subject).filter(Boolean))),
  );
  protected readonly filteredRecords = computed(() => {
    const status = this.statusFilter();
    const subject = this.subjectFilter();

    return this.records().filter(
      (record) =>
        (status === 'Todos' || record.status === status) && (subject === 'Todas' || record.subject === subject),
    );
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}
