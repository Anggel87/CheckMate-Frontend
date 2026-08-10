import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  EMPTY_TEACHER_INCIDENT_DETAIL,
  TeacherIncidentDetailView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-incident-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page teacher-incident-detail-page">
      <header class="teacher-detail-actions">
        <nav class="breadcrumbs" aria-label="Ruta de navegacion">
          <a [routerLink]="dashboardRoute()"
            ><i class="fa-solid fa-house" aria-hidden="true"></i
          ></a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <a [routerLink]="incidentBaseRoute()">Incidencias</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <strong>Incidente #{{ incident.id }}</strong>
        </nav>

        <div>
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="exportReport()">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
            Exportar
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="editIncident()">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
            Editar
          </button>
        </div>
      </header>

      <div class="teacher-incident-detail-layout">
        <article class="teacher-card teacher-incident-report">
          <span class="teacher-incident-ribbon">{{ incident.status || 'Sin estado' }}</span>
          <header>
            <span class="teacher-report-icon"><i [class]="incident.icon"></i></span>
            <div>
              <span class="teacher-kicker">Incidente<br />{{ incident.date }}</span>
              <h1>{{ incident.title || incident.type }}</h1>
            </div>
          </header>

          <section class="teacher-report-grid" aria-label="Datos del incidente">
            <div>
              <span>Tipo</span>
              <strong class="is-danger">{{ incident.type }}</strong>
            </div>
            <div>
              <span>Reportado por</span>
              <strong>{{ incident.reporter }}</strong>
            </div>
            <div>
              <span>Severidad</span>
              <strong>{{ incident.priority }}</strong>
            </div>
          </section>

          <section class="teacher-report-section">
            <h2>Descripcion</h2>
            <p>{{ incident.description || 'Sin descripcion registrada.' }}</p>
          </section>

          <section class="teacher-report-section">
            <h2>Evidencia</h2>
            @if (incident.evidenceUrl) {
              <a class="btn-checkmate btn-checkmate-secondary" [href]="incident.evidenceUrl" target="_blank" rel="noreferrer">
                Abrir evidencia
              </a>
            } @else {
              <p class="dropdown-empty">Sin evidencia adjunta.</p>
            }
          </section>
        </article>

        <aside class="teacher-side-stack">
          <article class="teacher-card teacher-location-card">
            <h2>Ubicacion</h2>
            <strong><i class="fa-solid fa-location-dot"></i> {{ incident.location || 'Sin ubicacion' }}</strong>
          </article>

          <article class="teacher-card teacher-attendance-status-card">
            <header>
              <h2>Estado de alumnos</h2>
              <span>{{ checkedStudents() }}/{{ incident.students.length }} revisados</span>
            </header>
            <div class="teacher-response-list">
              @for (student of incident.students.slice(0, 3); track student.id) {
                <div [class.is-safe]="student.status === 'PRESENTE'" [class.is-missing]="student.status === 'AUSENTE'">
                  <span>{{ student.name.slice(0, 2).toUpperCase() }}</span>
                  <strong>{{ student.name }}</strong>
                  <app-status-badge [label]="student.status || 'Pendiente'" [tone]="student.status === 'PRESENTE' ? 'success' : student.status === 'AUSENTE' ? 'danger' : 'neutral'" />
                </div>
              }
            </div>
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="incidentBaseRoute() + '/emergency-list'">
              Ver personal
            </a>
          </article>

          <article class="teacher-card teacher-timeline-card">
            <h2>Historial</h2>
            <ol>
              @for (item of incident.history; track item.title + item.date) {
                <li>
                  <strong>{{ item.date }} - {{ item.title }}</strong>
                  <span>{{ item.description }}</span>
                </li>
              } @empty {
                <li><span>Sin historial expuesto por la API.</span></li>
              }
            </ol>
          </article>
        </aside>
      </div>
    </section>
  `,
})
export class TeacherIncidentDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected incident: TeacherIncidentDetailView = EMPTY_TEACHER_INCIDENT_DETAIL;

  constructor() {
    this.teacherApi
      .getIncident(this.route.snapshot.paramMap.get('incidentId'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((incident) => {
        this.incident = incident;
      });
  }

  protected incidentBaseRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/incidents' : '/teacher/incidents';
  }

  protected dashboardRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/dashboard' : '/teacher/dashboard';
  }

  protected checkedStudents(): number {
    return this.incident.students.filter((student) => student.status !== '').length;
  }

  protected exportReport(): void {
    this.toastService.info('Reporte', 'La exportacion se habilitara cuando la API entregue PDF.');
  }

  protected editIncident(): void {
    this.toastService.info('Edicion no disponible', 'Este flujo solo consulta el detalle documentado.');
  }
}
