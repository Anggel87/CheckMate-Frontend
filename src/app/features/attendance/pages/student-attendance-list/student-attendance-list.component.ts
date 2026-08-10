import { Component, DestroyRef, inject, signal } from '@angular/core';
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
          <input class="checkmate-input" type="text" placeholder="mm/dd/yyyy" />
        </label>

        <label class="student-filter-control">
          <span class="sr-only">Filtrar por materia</span>
          <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
          <select class="checkmate-select">
            <option>Filtrar por materia</option>
            <option>Base de datos</option>
            <option>Redes</option>
            <option>Desarrollo de Software</option>
          </select>
        </label>

        <label class="student-filter-control">
          <span class="sr-only">Filtrar por estado</span>
          <i class="fa-solid fa-list-check" aria-hidden="true"></i>
          <select class="checkmate-select">
            <option>Filtrar por estado</option>
            <option>Presente</option>
            <option>Retardo</option>
            <option>Falta</option>
          </select>
        </label>

        <button type="button" class="btn-checkmate btn-checkmate-primary">Aplicar Filtros</button>
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
        } @else if (records.length === 0) {
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
                @for (record of records; track record.id) {
                  <tr>
                    <td>{{ record.date }}</td>
                    <td>{{ record.subject }}</td>
                    <td>{{ record.teacher }}</td>
                    <td>
                      <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                      @if (record.justified) {
                        <span class="student-mini-badge">J</span>
                      }
                    </td>
                    <td>
                      <a
                        class="student-link"
                        [routerLink]="['/student/attendance/detail', record.id]"
                        >Detalles</a
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="student-table-footer">
            <span>Mostrando {{ records.length }} registros</span>
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
  protected records: StudentAttendanceRecordView[] = [];

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
          this.records = records;
          this.loading.set(false);
        },
        error: () => {
          this.records = [];
          this.loading.set(false);
          this.error.set(true);
        },
      });
  }
}
