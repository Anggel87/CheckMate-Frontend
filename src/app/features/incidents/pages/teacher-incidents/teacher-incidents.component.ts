import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  TeacherIncidentView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-incidents',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="teacher-page teacher-incidents-page">
      <nav class="breadcrumbs" aria-label="Ruta de navegacion">
        <span>CheckMate</span>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Incidents</strong>
      </nav>

      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Incidentes</h1>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando incidentes..." [showLabel]="true" />
      } @else {
        <div class="teacher-incidents-layout">
          <section
            class="teacher-card teacher-incident-list-card"
            aria-label="Historial de incidentes"
          >
            <header class="teacher-incident-list-card__toolbar">
              <div class="teacher-filter-actions">
                <button type="button" class="teacher-filter-button" (click)="showFilterInfo('fecha')">
                  <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                  Filtro fecha
                  <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </button>
                <button type="button" class="teacher-filter-button" (click)="showFilterInfo('tipo')">
                  <i class="fa-solid fa-shapes" aria-hidden="true"></i>
                  Filtro Tipo
                  <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                </button>
              </div>
              <span class="teacher-sort-label">Sorting: <b>Recent First</b></span>
            </header>

            <div class="teacher-incident-list">
              @for (incident of incidents(); track incident.id) {
                <article
                  class="teacher-incident-row"
                  [class]="'teacher-incident-row tone-' + incident.tone"
                >
                  <span class="teacher-incident-row__icon">
                    <i [class]="incident.icon" aria-hidden="true"></i>
                  </span>
                  <div>
                    <h2>
                      {{ incident.title }}
                      <small>{{ incident.priority }}</small>
                    </h2>
                    <p>{{ incident.date }} • {{ incident.location }}</p>
                  </div>
                  <div class="teacher-incident-row__reporter">
                    <span>Reportado por</span>
                    <strong>{{ incident.reporter }}</strong>
                  </div>
                  <a
                    class="icon-button"
                    [routerLink]="[incidentBaseRoute(), incident.id]"
                    [attr.aria-label]="'Ver incidente ' + incident.id"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  </a>
                </article>
              } @empty {
                <p class="dropdown-empty">No hay incidentes reportados.</p>
              }
            </div>

            <a class="teacher-new-incident-button" [routerLink]="incidentBaseRoute() + '/new'">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nuevo incidente
            </a>
          </section>

          <aside class="teacher-side-stack" aria-label="Resumen de incidentes">
            <article class="teacher-card teacher-map-card">
              <div class="teacher-campus-map" aria-hidden="true">
                <span class="teacher-campus-map__pin"></span>
                <span class="teacher-live-badge"><i class="fa-solid fa-circle"></i> Live View</span>
              </div>
              <span>Ubicacion del ultimo incidente</span>
              <strong>{{ lastIncidentLocation() || 'Sin incidentes activos' }}</strong>
            </article>

            <article class="teacher-card teacher-week-summary">
              <h2>Resumen Semanal</h2>
              <div class="teacher-week-summary__row">
                <span class="is-critical"></span>
                <div><strong>Criticos</strong><small>Requieren accion inmediata</small></div>
                <b>{{ criticalCount() }}</b>
              </div>
              <div class="teacher-week-summary__row">
                <span class="is-active"></span>
                <div><strong>En Curso</strong><small>Siendo atendidos</small></div>
                <b>{{ activeCount() }}</b>
              </div>
              <div class="teacher-week-summary__row">
                <span class="is-muted"></span>
                <div><strong>Resueltos</strong><small>Archivados hoy</small></div>
                <b>{{ resolvedCount() }}</b>
              </div>
              <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="showWeeklyReport()">
                Ver Reporte Completo
              </button>
            </article>

            <article class="teacher-protocol-card">
              <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
              <h2>Protocolo de Emergencia</h2>
              <p>Recuerda siempre evacuar antes de reportar un incidente de nivel 5.</p>
              <a [routerLink]="incidentBaseRoute() + '/new'"
                >Leer guia <i class="fa-solid fa-arrow-right"></i
              ></a>
            </article>
          </aside>
        </div>
      }
    </section>
  `,
})
export class TeacherIncidentsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly incidents = signal<TeacherIncidentView[]>([]);

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

  protected showWeeklyReport(): void {
    this.toastService.info('Reporte semanal', 'El resumen completo se generara con los datos actuales.');
  }

  protected showFilterInfo(filter: 'fecha' | 'tipo'): void {
    this.toastService.info('Filtro aplicado', `Filtro por ${filter} preparado para la consulta.`);
  }

  protected lastIncidentLocation(): string {
    return this.incidents()[0]?.location ?? '';
  }

  protected criticalCount(): number {
    return this.incidents().filter((incident) => incident.tone === 'danger').length;
  }

  protected activeCount(): number {
    return this.incidents().filter((incident) => incident.status.toUpperCase().includes('ACT')).length;
  }

  protected resolvedCount(): number {
    return this.incidents().filter((incident) => incident.status.toUpperCase().includes('RES')).length;
  }
}
