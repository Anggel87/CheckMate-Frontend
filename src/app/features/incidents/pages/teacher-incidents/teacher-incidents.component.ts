import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  StatusBadgeComponent,
  StatusBadgeTone,
} from '../../../../shared/components/status-badge/status-badge.component';
import {
  TeacherIncidentView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

type IncidentTab = 'ACTIVO' | 'RESUELTO' | 'CANCELADO' | 'TODOS';

const TABS: { key: IncidentTab; label: string }[] = [
  { key: 'ACTIVO', label: 'Activos' },
  { key: 'RESUELTO', label: 'Resueltos' },
  { key: 'CANCELADO', label: 'Cancelados' },
  { key: 'TODOS', label: 'Todos' },
];

@Component({
  selector: 'app-teacher-incidents',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent, EmptyStateComponent],
  template: `
    <section class="teacher-page teacher-incidents-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Incidentes</h1>
          <p>Reporta y da seguimiento a las emergencias de tus grupos.</p>
        </div>

        <a class="btn-checkmate btn-checkmate-primary" [routerLink]="incidentBaseRoute() + '/new'">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          Nuevo incidente
        </a>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando incidentes..." [showLabel]="true" />
      } @else {
        <section class="teacher-stats-grid" aria-label="Resumen de incidentes">
          <article class="teacher-stat-card">
            <span>Activos</span>
            <strong>{{ countByStatus('ACTIVO') }}</strong>
            <i class="fa-solid fa-triangle-exclamation is-danger" aria-hidden="true"></i>
          </article>
          <article class="teacher-stat-card">
            <span>Resueltos</span>
            <strong>{{ countByStatus('RESUELTO') }}</strong>
            <i class="fa-regular fa-circle-check is-success" aria-hidden="true"></i>
          </article>
          <article class="teacher-stat-card">
            <span>Cancelados</span>
            <strong>{{ countByStatus('CANCELADO') }}</strong>
            <i class="fa-regular fa-circle-xmark is-warning" aria-hidden="true"></i>
          </article>
        </section>

        <section class="teacher-table-card" aria-label="Historial de incidentes">
          <div class="teacher-tabs">
            @for (tab of tabs; track tab.key) {
              <button type="button" [class.is-active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
                {{ tab.label }}
              </button>
            }
          </div>

          @if (filteredIncidents().length === 0) {
            <app-empty-state
              icon="fa-solid fa-triangle-exclamation"
              title="Sin incidentes"
              description="No hay incidentes registrados en esta categoria."
            />
          } @else {
            <div class="teacher-table teacher-incidents-table">
              <div class="teacher-table__row teacher-table__row--header">
                <span>Fecha</span>
                <span>Tipo</span>
                <span>Titulo</span>
                <span>Severidad</span>
                <span>Estado</span>
                <span>Accion</span>
              </div>
              @for (incident of filteredIncidents(); track incident.id) {
                <div class="teacher-table__row">
                  <span>{{ incident.date }}</span>
                  <span>
                    <i [class]="incident.icon" aria-hidden="true"></i>
                    {{ typeLabel(incident.type) }}
                  </span>
                  <span>{{ incident.title }}</span>
                  <app-status-badge [label]="incident.priority || 'No especificada'" [tone]="incident.tone" />
                  <app-status-badge [label]="incident.status" [tone]="statusTone(incident.status)" />
                  <a
                    class="icon-button"
                    [routerLink]="[incidentBaseRoute(), incident.id]"
                    [attr.aria-label]="'Ver incidente ' + incident.id"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  </a>
                </div>
              }
            </div>
          }
        </section>
      }
    </section>
  `,
})
export class TeacherIncidentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly incidents = signal<TeacherIncidentView[]>([]);
  protected readonly activeTab = signal<IncidentTab>('ACTIVO');
  protected readonly tabs = TABS;

  protected readonly filteredIncidents = computed(() => {
    const tab = this.activeTab();

    if (tab === 'TODOS') {
      return this.incidents();
    }

    return this.incidents().filter((incident) => incident.status.toUpperCase() === tab);
  });

  constructor() {
    this.teacherApi
      .getIncidents()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((incidents) => {
        this.incidents.set(incidents);
      });
  }

  protected incidentBaseRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/incidents' : '/teacher/incidents';
  }

  protected countByStatus(status: string): number {
    return this.incidents().filter((incident) => incident.status.toUpperCase() === status).length;
  }

  protected statusTone(status: string): StatusBadgeTone {
    const normalized = status.toUpperCase();

    if (normalized === 'RESUELTO') {
      return 'success';
    }

    if (normalized === 'CANCELADO') {
      return 'neutral';
    }

    return 'danger';
  }

  protected typeLabel(type: string): string {
    const labels: Record<string, string> = {
      FIRE: 'Incendio',
      GAS: 'Gas',
      EARTHQUAKE: 'Terremoto',
      OTHER: 'Otro',
    };

    return labels[type.toUpperCase()] ?? type;
  }
}
