import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StudentJustificationView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-justifications',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mis Justificantes</h1>
          <p>Gestiona y haz seguimiento a tus solicitudes de inasistencia.</p>
        </div>

        <a
          class="btn-checkmate btn-checkmate-primary"
          routerLink="/student/justifications/select-absence"
        >
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          <span>Crear Justificante</span>
        </a>
      </header>

      <section class="student-card student-search-tabs" aria-label="Filtros de justificantes">
        <label class="student-search-control">
          <span class="sr-only">Buscar justificantes</span>
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            class="checkmate-input"
            type="search"
            placeholder="Buscar por fecha o motivo..."
            (input)="search.set(inputValue($event))"
          />
        </label>

        <div class="student-tabs" role="tablist" aria-label="Estado de justificante">
          @for (tab of tabs; track tab) {
            <button
              type="button"
              [class.is-active]="tab === activeTab()"
              (click)="activeTab.set(tab)"
            >
              {{ tab }}
            </button>
          }
        </div>
      </section>

      @if (loading()) {
        <app-loading-spinner label="Cargando justificantes..." [showLabel]="true" />
      } @else {
        <article class="student-card student-request-list-card">
          @if (filteredJustifications().length === 0) {
            <app-empty-state
              icon="fa-regular fa-file-lines"
              title="Sin justificantes"
              description="Cuando envies una solicitud aparecera en este historial."
            />
          } @else {
            <div class="student-request-list">
              @for (item of filteredJustifications(); track item.id) {
                <a class="student-request-row" [routerLink]="['/student/justifications', item.id]">
                  <div>
                    <app-status-badge [label]="item.status" [tone]="item.statusTone" />
                    <h2>{{ item.title }}</h2>
                    <p>{{ item.description }}</p>
                  </div>

                  <aside>
                    <time>{{ item.date }}</time>
                    <span class="student-attachment-pill">
                      <i class="fa-solid fa-paperclip" aria-hidden="true"></i>
                      {{ item.attachments }} {{ item.attachments === 1 ? 'adjunto' : 'adjuntos' }}
                    </span>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                  </aside>
                </a>
              }
            </div>
          }
        </article>

        <footer class="student-table-footer">
          <span>Mostrando {{ filteredJustifications().length }} registros</span>
          <div class="student-pagination" aria-label="Paginacion de justificantes">
            <button type="button" disabled aria-label="Pagina anterior">
              <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" class="is-active">1</button>
            <button type="button" disabled aria-label="Pagina siguiente">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </footer>
      }
    </section>
  `,
})
export class StudentJustificationsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly activeTab = signal('Todos');
  protected readonly tabs = ['Todos', 'Pendientes', 'Aprobados', 'Rechazados'];
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly justifications = signal<StudentJustificationView[]>([]);

  private readonly tabStatus: Record<string, string> = {
    Pendientes: 'Pendiente',
    Aprobados: 'Aprobado',
    Rechazados: 'Rechazado',
  };

  protected readonly filteredJustifications = computed(() => {
    const tab = this.activeTab();
    const term = this.search().trim().toLowerCase();
    const status = this.tabStatus[tab];

    return this.justifications().filter((item) => {
      const matchesStatus = !status || item.status === status;
      const matchesTerm =
        term.length === 0 ||
        item.date.toLowerCase().includes(term) ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
  });

  constructor() {
    this.studentApi
      .getJustifications()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((justifications) => {
        this.justifications.set(justifications);
      });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
