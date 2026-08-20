import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StudentAttendanceRecordView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-attendance-list',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
  ],
  template: `
    <section class="student-page">
      <section class="student-card student-filter-card" aria-label="Filtros de asistencias">
        <label class="student-filter-control">
          <span class="sr-only">Filtrar por fecha</span>
          <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
          <input
            class="checkmate-input"
            type="date"
            [value]="dateFilter()"
            (change)="dateFilter.set(inputValue($event))"
          />
        </label>

        <label class="student-filter-control">
          <span class="sr-only">Filtrar por materia</span>
          <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
          <select class="checkmate-select" [value]="subjectFilter()" (change)="subjectFilter.set(inputValue($event))">
            <option value="">Todas las materias</option>
            @for (subject of subjectOptions(); track subject) {
              <option [value]="subject">{{ subject }}</option>
            }
          </select>
        </label>

        <label class="student-filter-control">
          <span class="sr-only">Filtrar por estado</span>
          <i class="fa-solid fa-list-check" aria-hidden="true"></i>
          <select class="checkmate-select" [value]="statusFilter()" (change)="statusFilter.set(inputValue($event))">
            <option value="">Todos los estados</option>
            <option value="present">Presente</option>
            <option value="late">Retardo</option>
            <option value="absent">Falta</option>
            <option value="justified">Justificado</option>
          </select>
        </label>

        <button
          type="button"
          class="btn-checkmate btn-checkmate-secondary"
          [disabled]="!hasActiveFilters()"
          (click)="clearFilters()"
        >
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          Limpiar Filtros
        </button>
      </section>

      <article class="student-card student-table-card">
        @if (loading()) {
          <app-loading-spinner label="Cargando asistencias" [showLabel]="true" />
        } @else if (error()) {
          <app-error-state
            title="No se pudieron cargar tus asistencias"
            description="Intenta nuevamente para consultar tu historial."
            (retry)="retry()"
          />
        } @else if (records().length === 0) {
          <app-empty-state
            icon="fa-regular fa-calendar-check"
            title="Sin asistencias registradas"
            description="Cuando tengas registros de clase apareceran aqui."
          />
        } @else {
          <div class="student-table-wrapper">
            <table class="student-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Materia</th>
                  <th scope="col">Docente</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.id) {
                  <tr>
                    <td>{{ record.date }}</td>
                    <td>{{ record.subject }}</td>
                    <td>
                      @if (record.teacherId) {
                        <a class="student-inline-link" [routerLink]="['/student/teachers', record.teacherId]">{{
                          record.teacher
                        }}</a>
                      } @else {
                        {{ record.teacher }}
                      }
                    </td>
                    <td>
                      <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                      @if (record.justified) {
                        <span class="student-mini-badge">J</span>
                      }
                      <div class="student-attendance-flags">
                        @if (record.justificationStatusLabel) {
                          <a
                            class="student-attendance-flag"
                            [routerLink]="['/student/justifications', record.justificationId]"
                          >
                            <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                            Justificante: {{ record.justificationStatusLabel }}
                          </a>
                        }
                        @if (record.claimStatusLabel) {
                          <a class="student-attendance-flag" [routerLink]="['/student/claims', record.claimId]">
                            <i class="fa-solid fa-bullhorn" aria-hidden="true"></i>
                            Reclamo: {{ record.claimStatusLabel }}
                          </a>
                        }
                      </div>
                    </td>
                    <td>
                      <a
                        class="student-link"
                        [routerLink]="['/student/attendance/detail', record.id]"
                        >Detalles</a
                      >
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="dropdown-empty">
                      Ningun registro coincide con los filtros aplicados.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="student-table-footer">
            <span>Mostrando {{ filteredRecords().length }} registros</span>
            <div class="student-pagination" aria-label="Paginacion">
              <button type="button" disabled aria-label="Pagina anterior">
                <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
              <button type="button" class="is-active">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" aria-label="Pagina siguiente">
                <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </footer>
        }
      </article>
    </section>
  `,
})
export class StudentAttendanceListComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly records = signal<StudentAttendanceRecordView[]>([]);
  protected readonly dateFilter = signal('');
  protected readonly subjectFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly subjectOptions = computed(() => {
    const names = new Set(this.records().map((record) => record.subject).filter(Boolean));
    return [...names].sort((left, right) => left.localeCompare(right));
  });

  protected readonly hasActiveFilters = computed(
    () => Boolean(this.dateFilter() || this.subjectFilter() || this.statusFilter()),
  );

  protected readonly filteredRecords = computed(() => {
    const date = this.dateFilter();
    const subject = this.subjectFilter();
    const status = this.statusFilter();

    return this.records().filter((record) => {
      const matchesDate = !date || this.toIsoDate(record.rawDate) === date;
      const matchesSubject = !subject || record.subject === subject;
      const matchesStatus = !status || record.statusTone === status;
      return matchesDate && matchesSubject && matchesStatus;
    });
  });

  constructor() {
    this.loadRecords();
  }

  protected retry(): void {
    this.error.set(false);
    this.loadRecords();
  }

  private loadRecords(): void {
    this.loading.set(true);
    this.error.set(false);

    this.studentApi
      .getAttendanceRecords()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.loading.set(false);
        },
        error: () => {
          this.records.set([]);
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected clearFilters(): void {
    this.dateFilter.set('');
    this.subjectFilter.set('');
    this.statusFilter.set('');
  }

  private toIsoDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }
}
