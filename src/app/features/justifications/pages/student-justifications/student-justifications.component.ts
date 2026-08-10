import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StudentJustificationView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-justifications',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, StatusBadgeComponent],
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
          <input class="checkmate-input" type="search" placeholder="Buscar por fecha o motivo..." />
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

      <article class="student-card student-request-list-card">
        @if (justifications.length === 0) {
          <app-empty-state
            icon="fa-regular fa-file-lines"
            title="Sin justificantes"
            description="Cuando envies una solicitud aparecera en este historial."
          />
        } @else {
          <div class="student-request-list">
            @for (item of justifications; track item.id) {
              <a class="student-request-row" routerLink="/student/justifications">
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
        <span>Mostrando {{ justifications.length }} registros</span>
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
    </section>
  `,
})
export class StudentJustificationsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly activeTab = signal('Todos');
  protected readonly tabs = ['Todos', 'Pendientes', 'Aprobados', 'Rechazados'];
  protected justifications: StudentJustificationView[] = [];

  constructor() {
    this.studentApi
      .getJustifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((justifications) => {
        this.justifications = justifications;
      });
  }
}
