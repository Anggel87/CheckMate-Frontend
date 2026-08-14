import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { downloadPdfReport } from '../../../../shared/utils/pdf-report.util';
import {
  EMPTY_TEACHER_INCIDENT_DETAIL,
  TeacherGroupView,
  TeacherIncidentDetailView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-incident-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, LoadingSpinnerComponent, StatusBadgeComponent, FileUploadComponent],
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
          <strong>Incidente #{{ incident().id }}</strong>
        </nav>

        @if (!loading() && !editing() && incident().status === 'ACTIVO') {
          <div>
            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="exportReport()">
              <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
              Exportar
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="startEditing()">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
              Editar
            </button>
          </div>
        } @else if (!loading() && !editing()) {
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="exportReport()">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
            Exportar
          </button>
        }
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando incidente..." [showLabel]="true" />
      } @else if (editing()) {
        <form class="teacher-card teacher-incident-form-card" [formGroup]="editForm" (ngSubmit)="saveEdit()">
          <h2><i class="fa-solid fa-pen" aria-hidden="true"></i> Editar incidente</h2>

          <label class="teacher-form-field" for="edit-title">
            <span class="checkmate-label">Titulo</span>
            <input id="edit-title" class="checkmate-input" type="text" formControlName="title" />
          </label>

          <label class="teacher-form-field" for="edit-description">
            <span class="checkmate-label">Descripcion</span>
            <textarea id="edit-description" class="checkmate-textarea" formControlName="description"></textarea>
          </label>

          <div class="teacher-form-grid">
            <label class="teacher-form-field" for="edit-severity">
              <span class="checkmate-label">Severidad</span>
              <select id="edit-severity" class="checkmate-select" formControlName="severity">
                <option value="">No especificada</option>
                <option value="CRITICA">Critica</option>
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </label>

            <label class="teacher-form-field" for="edit-type">
              <span class="checkmate-label">Tipo</span>
              <select id="edit-type" class="checkmate-select" formControlName="type">
                <option value="FIRE">Incendio</option>
                <option value="GAS">Gas</option>
                <option value="EARTHQUAKE">Terremoto</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
          </div>

          <div class="teacher-form-field">
            <span class="checkmate-label">Reemplazar evidencia</span>
            <app-file-upload
              title="Haz clic para subir una foto o documento"
              description="JPG, PNG o PDF, maximo 5MB."
              accept="image/png,image/jpeg,application/pdf"
              [maxSizeMb]="5"
              (filesSelected)="selectEvidence($event)"
              (fileRemoved)="clearEvidence()"
            />
          </div>

          <div class="teacher-form-field">
            <span class="checkmate-label">Agregar grupos a la verificacion</span>
            <p class="teacher-help-note">
              Selecciona grupos para sumar a sus alumnos activos a la lista de verificacion. Los
              alumnos que ya estan en la lista no se duplican.
            </p>
            <div class="teacher-checkbox-list">
              @for (group of editGroups(); track group.id) {
                <label class="checkmate-checkbox">
                  <input
                    type="checkbox"
                    [checked]="isGroupSelected(group.id)"
                    (change)="toggleGroup(group.id)"
                  />
                  <span>{{ group.group }} - {{ group.career }}</span>
                </label>
              } @empty {
                <p class="dropdown-empty">No tienes grupos activos asignados.</p>
              }
            </div>
          </div>

          <footer class="student-form-actions">
            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancelEditing()">
              Cancelar
            </button>
            <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="saving()">
              @if (saving()) {
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Guardando...
              } @else {
                Guardar cambios
              }
            </button>
          </footer>
        </form>
      } @else {
        <div class="teacher-incident-detail-layout">
          <article class="teacher-card teacher-incident-report">
            <span class="teacher-incident-ribbon">{{ incident().status || 'Sin estado' }}</span>
            <header>
              <span class="teacher-report-icon"><i [class]="incident().icon"></i></span>
              <div>
                <span class="teacher-kicker">Incidente<br />{{ incident().date }}</span>
                <h1>{{ incident().title || incident().type }}</h1>
              </div>
            </header>

            <section class="teacher-report-grid" aria-label="Datos del incidente">
              <div>
                <span>Tipo</span>
                <strong class="is-danger">{{ incident().type }}</strong>
              </div>
              <div>
                <span>Reportado por</span>
                <strong>{{ incident().reporter }}</strong>
              </div>
              <div>
                <span>Severidad</span>
                <strong>{{ incident().priority || 'No especificada' }}</strong>
              </div>
            </section>

            <section class="teacher-report-section">
              <h2>Descripcion</h2>
              <p>{{ incident().description || 'Sin descripcion registrada.' }}</p>
            </section>

            <section class="teacher-report-section">
              <h2>Evidencia</h2>
              @if (incident().evidenceUrl) {
                <a class="btn-checkmate btn-checkmate-secondary" [href]="incident().evidenceUrl" target="_blank" rel="noreferrer">
                  Abrir evidencia
                </a>
              } @else {
                <p class="dropdown-empty">Sin evidencia adjunta.</p>
              }
            </section>
          </article>

          <aside class="teacher-side-stack">
            <article class="teacher-card teacher-student-details-card">
              <h2><i class="fa-solid fa-users" aria-hidden="true"></i> Grupos afectados</h2>
              @if (incident().groups.length) {
                <div class="badge-row">
                  @for (group of incident().groups; track group) {
                    <span class="status-badge status-badge--info">{{ group }}</span>
                  }
                </div>
              } @else {
                <p class="dropdown-empty">Sin grupos registrados.</p>
              }
            </article>

            <article class="teacher-card teacher-attendance-status-card">
              <header>
                <h2>Estado de alumnos</h2>
                <span>{{ checkedStudents() }}/{{ incident().students.length }} revisados</span>
              </header>
              <div class="teacher-response-list">
                @for (student of incident().students.slice(0, 3); track student.id) {
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
                @for (item of incident().history; track $index) {
                  <li>
                    <strong>{{ item.date }} - {{ item.title }}</strong>
                    <span>{{ item.description }}</span>
                    <small>{{ item.actor }}</small>
                  </li>
                } @empty {
                  <li><span>Sin historial disponible.</span></li>
                }
              </ol>
            </article>
          </aside>
        </div>
      }
    </section>
  `,
})
export class TeacherIncidentDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly incident = signal<TeacherIncidentDetailView>(EMPTY_TEACHER_INCIDENT_DETAIL);
  protected readonly editGroups = signal<TeacherGroupView[]>([]);
  protected readonly selectedGroupIds = signal<string[]>([]);
  private evidence: File | null = null;

  protected readonly editForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    severity: ['', []],
    type: ['FIRE', Validators.required],
  });

  constructor() {
    this.teacherApi
      .getIncident(this.route.snapshot.paramMap.get('incidentId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((incident) => {
        this.incident.set(incident);
      });
  }

  protected incidentBaseRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/incidents' : '/teacher/incidents';
  }

  protected dashboardRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/dashboard' : '/teacher/dashboard';
  }

  protected checkedStudents(): number {
    return this.incident().students.filter((student) => student.status !== '').length;
  }

  protected exportReport(): void {
    const incident = this.incident();

    downloadPdfReport({
      title: `Incidente #${incident.id}`,
      subtitle: incident.title || incident.type,
      meta: [
        { label: 'Tipo', value: incident.type },
        { label: 'Fecha', value: incident.date },
        { label: 'Reportado por', value: incident.reporter },
        { label: 'Severidad', value: incident.priority || 'No especificada' },
        { label: 'Grupos afectados', value: incident.groups.join(', ') || 'Sin grupos registrados' },
        { label: 'Descripcion', value: incident.description || 'Sin descripcion registrada.' },
      ],
      tables: [
        {
          title: 'Estado de alumnos',
          columns: ['Alumno', 'Estado'],
          rows: incident.students.map((student) => [student.name, student.status || 'Pendiente']),
        },
        {
          title: 'Historial',
          columns: ['Fecha', 'Evento', 'Descripcion', 'Responsable'],
          rows: incident.history.map((item) => [item.date, item.title, item.description, item.actor]),
        },
      ],
      fileName: `incidente-${incident.id}.pdf`,
    });
  }

  protected startEditing(): void {
    const incident = this.incident();
    this.editForm.reset({
      title: incident.title,
      description: incident.description,
      severity: incident.priority,
      type: incident.type,
    });
    this.evidence = null;
    this.selectedGroupIds.set([]);
    this.editing.set(true);

    this.teacherApi
      .getGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => this.editGroups.set(groups));
  }

  protected cancelEditing(): void {
    this.editing.set(false);
    this.evidence = null;
  }

  protected isGroupSelected(groupId: string): boolean {
    return this.selectedGroupIds().includes(groupId);
  }

  protected toggleGroup(groupId: string): void {
    this.selectedGroupIds.update((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  }

  protected selectEvidence(files: File[]): void {
    this.evidence = files[0] ?? null;
  }

  protected clearEvidence(): void {
    this.evidence = null;
  }

  protected saveEdit(): void {
    if (this.editForm.invalid) {
      return;
    }

    const value = this.editForm.getRawValue();

    this.saving.set(true);
    this.teacherApi
      .updateIncident(this.incident().id, {
        type: value.type,
        title: value.title,
        description: value.description,
        severity: value.severity,
        groupIds: this.selectedGroupIds(),
        evidence: this.evidence,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (incident) => {
          this.incident.set(incident);
          this.editing.set(false);
          this.evidence = null;
          this.selectedGroupIds.set([]);
          this.toastService.success('Incidente actualizado', 'Los cambios se guardaron correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo actualizar',
            apiErrorMessage(error, 'Revisa los datos e intenta de nuevo.'),
          );
        },
      });
  }
}
