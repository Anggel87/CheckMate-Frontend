import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-justifications',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page tutor-justifications-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Justificantes</h1>
          <p>Gestiona y revisa el estado de los justificantes de tus alumnos tutorados.</p>
        </div>
        <a class="btn-checkmate btn-checkmate-primary" routerLink="/tutor/justifications/new">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          Nuevo justificante
        </a>
      </header>

      <section class="stats-grid tutor-stats-grid" aria-label="Resumen de justificantes">
        <article class="teacher-stat-card">
          <span>Total generados</span>
          <strong>{{ total() }} <small>este ciclo</small></strong>
          <i class="fa-regular fa-folder is-neutral" aria-hidden="true"></i>
        </article>
        <article class="teacher-stat-card">
          <span>Aprobados</span>
          <strong>{{ approved() }}</strong>
          <i class="fa-regular fa-circle-check is-success" aria-hidden="true"></i>
        </article>
        <article class="teacher-stat-card">
          <span>Pendientes</span>
          <strong>{{ pending() }}</strong>
          <i class="fa-regular fa-clock is-warning" aria-hidden="true"></i>
        </article>
        <article class="teacher-stat-card">
          <span>Rechazados</span>
          <strong>{{ rejected() }}</strong>
          <i class="fa-regular fa-circle-xmark is-danger" aria-hidden="true"></i>
        </article>
      </section>

      <section class="teacher-table-card" aria-label="Tabla de justificantes">
        <header class="teacher-table-card__header">
          <label class="tutor-search-control">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span class="sr-only">Buscar justificante</span>
            <input
              class="checkmate-input"
              type="search"
              placeholder="Buscar justificante..."
              (input)="search.set(inputValue($event))"
            />
          </label>
          <div class="teacher-filter-actions">
            <select class="checkmate-select tutor-compact-select" (change)="statusFilter.set(inputValue($event))">
              <option value="Todos">Estado: Todos</option>
              <option value="Pendiente">Pendientes</option>
              <option value="Aprobado">Aprobados</option>
              <option value="Rechazado">Rechazados</option>
            </select>
            <select class="checkmate-select tutor-compact-select">
              <option>Asignatura: Todas</option>
              <option>Base de datos</option>
              <option>Matematicas Avanzadas II</option>
            </select>
          </div>
        </header>

        <div class="teacher-table tutor-justifications-table">
          <div class="teacher-table__row teacher-table__row--header">
            <span>Asignatura / motivo</span>
            <span>Alumno</span>
            <span>Fecha asistencia</span>
            <span>Fecha envio</span>
            <span>Estado</span>
            <span>Accion</span>
          </div>
          @for (item of filteredJustifications(); track item.id) {
            <div class="teacher-table__row">
              <div>
                <strong>{{ item.subject }}</strong>
                <small>{{ item.reason }}</small>
              </div>
              <span>{{ item.studentName }} - {{ item.group }}</span>
              <span>{{ item.absenceDate }}</span>
              <span>{{ item.sentDate }}</span>
              <app-status-badge [label]="item.status" [tone]="item.statusTone" />
              <a class="icon-button" [routerLink]="['/tutor/justifications', item.id]" [attr.aria-label]="'Abrir ' + item.title">
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>
            </div>
          }
        </div>

        <footer class="teacher-table-footer">
          <span>Mostrando {{ filteredJustifications().length }} de {{ total() }}</span>
          <div>
            <button type="button" class="icon-button" disabled aria-label="Pagina anterior">
              <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" class="icon-button" disabled aria-label="Pagina siguiente">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </footer>
      </section>
    </section>
  `,
})
export class TutorJustificationsComponent {
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly justifications = this.tutoringData.justifications;
  protected readonly search = signal('');
  protected readonly statusFilter = signal('Todos');
  protected readonly total = computed(() => this.justifications().length);
  protected readonly approved = computed(
    () => this.justifications().filter((item) => item.status === 'Aprobado').length,
  );
  protected readonly pending = computed(
    () => this.justifications().filter((item) => item.status === 'Pendiente').length,
  );
  protected readonly rejected = computed(
    () => this.justifications().filter((item) => item.status === 'Rechazado').length,
  );
  protected readonly filteredJustifications = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.justifications().filter((item) => {
      const matchesStatus = status === 'Todos' || item.status === status;
      const matchesTerm =
        term.length === 0 ||
        item.subject.toLowerCase().includes(term) ||
        item.studentName.toLowerCase().includes(term) ||
        item.reason.toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
  });

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
