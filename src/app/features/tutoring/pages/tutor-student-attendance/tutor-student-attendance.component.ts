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

      <section class="teacher-card tutor-student-aside tutor-student-aside--banner">
        @if (student().avatarUrl) {
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
        } @else {
          <span class="avatar">{{ student().initials }}</span>
        }
        <h2>{{ student().name }}</h2>
        <dl>
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

      <div class="tutor-attendance-layout">
        <section class="teacher-profile-main">
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

        <aside class="teacher-card tutor-filter-card">
          <h2>Filtrar historial</h2>

          @if (subjects().length > 1) {
            <div class="tutor-filter-group">
              <span class="checkmate-label">Materia</span>
              <nav class="teacher-tabs tutor-subject-tabs" aria-label="Materias">
                <button type="button" [class.is-active]="subjectFilter() === 'Todas'" (click)="subjectFilter.set('Todas')">
                  Todas
                </button>
                @for (subject of subjects(); track subject) {
                  <button
                    type="button"
                    [class.is-active]="subjectFilter() === subject"
                    (click)="subjectFilter.set(subject)"
                  >
                    {{ subject }}
                  </button>
                }
              </nav>
            </div>
          }

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

          <label class="teacher-form-field" for="attendance-period">
            <span class="checkmate-label">Periodo</span>
            <select
              id="attendance-period"
              class="checkmate-select"
              [value]="periodFilter()"
              (change)="setPeriod($event)"
            >
              <option value="Ciclo">Ciclo escolar completo</option>
              <option value="Mes">Este mes</option>
              <option value="4Meses">Ultimos 4 meses</option>
              <option value="Personalizado">Rango personalizado</option>
            </select>
          </label>

          @if (periodFilter() === 'Personalizado') {
            <div class="tutor-filter-group tutor-date-range">
              <label class="teacher-form-field" for="attendance-from">
                <span class="checkmate-label">Desde</span>
                <input
                  id="attendance-from"
                  type="date"
                  class="checkmate-input"
                  [value]="customFrom()"
                  (change)="customFrom.set(inputValue($event))"
                />
              </label>
              <label class="teacher-form-field" for="attendance-to">
                <span class="checkmate-label">Hasta</span>
                <input
                  id="attendance-to"
                  type="date"
                  class="checkmate-input"
                  [value]="customTo()"
                  (change)="customTo.set(inputValue($event))"
                />
              </label>
            </div>
          }

          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="clearFilters()">
            Limpiar filtros
          </button>
        </aside>
      </div>
    </section>
  `,
})
export class TutorStudentAttendanceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly statusFilter = signal('Todos');
  protected readonly subjectFilter = signal('Todas');
  protected readonly periodFilter = signal<'Ciclo' | 'Mes' | '4Meses' | 'Personalizado'>('Ciclo');
  protected readonly customFrom = signal('');
  protected readonly customTo = signal('');
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
    const [rangeStart, rangeEnd] = this.periodRange();

    return this.records().filter((record) => {
      if (status !== 'Todos' && record.status !== status) {
        return false;
      }

      if (subject !== 'Todas' && record.subject !== subject) {
        return false;
      }

      if (rangeStart || rangeEnd) {
        const recordDate = new Date(record.rawDate);

        if (Number.isNaN(recordDate.getTime())) {
          return false;
        }

        if (rangeStart && recordDate < rangeStart) {
          return false;
        }

        if (rangeEnd && recordDate > rangeEnd) {
          return false;
        }
      }

      return true;
    });
  });

  private readonly periodRange = computed<[Date | null, Date | null]>(() => {
    const period = this.periodFilter();
    const now = new Date();

    if (period === 'Mes') {
      return [new Date(now.getFullYear(), now.getMonth(), 1), null];
    }

    if (period === '4Meses') {
      return [new Date(now.getFullYear(), now.getMonth() - 3, 1), null];
    }

    if (period === 'Personalizado') {
      const from = this.customFrom() ? new Date(`${this.customFrom()}T00:00:00`) : null;
      const to = this.customTo() ? new Date(`${this.customTo()}T23:59:59`) : null;

      return [from && !Number.isNaN(from.getTime()) ? from : null, to && !Number.isNaN(to.getTime()) ? to : null];
    }

    return [null, null];
  });

  protected clearFilters(): void {
    this.statusFilter.set('Todos');
    this.subjectFilter.set('Todas');
    this.periodFilter.set('Ciclo');
    this.customFrom.set('');
    this.customTo.set('');
  }

  protected setPeriod(event: Event): void {
    const value = this.inputValue(event);

    if (value === 'Ciclo' || value === 'Mes' || value === '4Meses' || value === 'Personalizado') {
      this.periodFilter.set(value);
    }
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
