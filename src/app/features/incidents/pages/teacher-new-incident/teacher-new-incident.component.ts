import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import { TeacherGroupView, TeacherPortalApiService } from '../../../teacher-portal/data-access/teacher-portal-api.service';

type TeacherIncidentControl = 'incidentType' | 'title' | 'description' | 'severity';

const INCIDENT_TYPES = [
  {
    value: 'FIRE',
    label: 'Fuego',
    subtitle: 'Alta prioridad',
    icon: 'fa-solid fa-fire-flame-curved',
    tone: 'danger',
  },
  {
    value: 'GAS',
    label: 'Gas',
    subtitle: 'Peligro quimico',
    icon: 'fa-solid fa-fire-extinguisher',
    tone: 'warning',
  },
  {
    value: 'EARTHQUAKE',
    label: 'Terremoto',
    subtitle: 'Desastre natural',
    icon: 'fa-solid fa-wave-square',
    tone: 'neutral',
  },
  {
    value: 'OTHER',
    label: 'Otro',
    subtitle: 'Otra emergencia',
    icon: 'fa-solid fa-circle-info',
    tone: 'neutral',
  },
] as const;

@Component({
  selector: 'app-teacher-new-incident',
  standalone: true,
  imports: [ReactiveFormsModule, FormValidationMessageComponent, FileUploadComponent],
  template: `
    <section class="teacher-page teacher-new-incident-page">
      <header class="teacher-page__header">
        <div>
          <h1>Reportar Nuevo Incidente</h1>
          <p>
            Selecciona el tipo de emergencia y los grupos afectados para generar la lista de
            verificacion de alumnos.
          </p>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset class="teacher-incident-type-grid">
          <legend class="sr-only">Tipo de emergencia</legend>
          @for (type of incidentTypes; track type.value) {
            <button
              type="button"
              class="teacher-emergency-type-card"
              [class.is-selected]="form.controls.incidentType.value === type.value"
              [class]="'teacher-emergency-type-card tone-' + type.tone"
              [attr.aria-pressed]="form.controls.incidentType.value === type.value"
              (click)="selectType(type.value)"
            >
              @if (form.controls.incidentType.value === type.value) {
                <span class="teacher-emergency-type-card__check" aria-hidden="true">
                  <i class="fa-solid fa-check"></i>
                </span>
              }
              <span><i [class]="type.icon" aria-hidden="true"></i></span>
              <strong>{{ type.label }}</strong>
              <small>{{ type.subtitle }}</small>
            </button>
          }
        </fieldset>

        <section class="teacher-card teacher-incident-form-card">
          <h2>
            <i class="fa-solid fa-list-check" aria-hidden="true"></i> Detalles del Incidente
          </h2>

          <label class="teacher-form-field" for="incident-title">
            <span class="checkmate-label">Titulo del incidente</span>
            <input
              id="incident-title"
              class="checkmate-input"
              type="text"
              placeholder="Ej: Fuga de gas detectada en ala norte"
              formControlName="title"
              [class.is-invalid]="errorFor('title', 'Titulo del incidente')"
              aria-describedby="incident-title-error"
            />
            <p class="teacher-help-note">
              Si no hay tiempo de escribirlo, dejalo en blanco: se genera uno automatico con la
              fecha.
            </p>
            <app-form-validation-message
              id="incident-title-error"
              [message]="errorFor('title', 'Titulo del incidente')"
            />
          </label>

          <label class="teacher-form-field" for="incident-description">
            <span class="checkmate-label">Descripcion (opcional)</span>
            <textarea
              id="incident-description"
              class="checkmate-textarea"
              placeholder="Describa la situacion con el mayor detalle posible..."
              formControlName="description"
              [class.is-invalid]="errorFor('description', 'Descripcion')"
              aria-describedby="incident-description-error"
            ></textarea>
            <app-form-validation-message
              id="incident-description-error"
              [message]="errorFor('description', 'Descripcion')"
            />
          </label>

          <label class="teacher-form-field" for="incident-severity">
            <span class="checkmate-label">Severidad (opcional)</span>
            <select
              id="incident-severity"
              class="checkmate-select"
              formControlName="severity"
              [class.is-invalid]="errorFor('severity', 'Severidad')"
              aria-describedby="incident-severity-error"
            >
              <option value="">No especificada</option>
              <option value="CRITICA">Critica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Media</option>
              <option value="BAJA">Baja</option>
            </select>
            <app-form-validation-message
              id="incident-severity-error"
              [message]="errorFor('severity', 'Severidad')"
            />
          </label>

          <div class="teacher-form-field">
            <span class="checkmate-label">Grupos afectados (opcional)</span>
            <p class="teacher-help-note">
              Se generara la lista de verificacion con los alumnos activos de los grupos que
              selecciones. Si no seleccionas ninguno ahora, podras agregarlos despues editando
              el incidente.
            </p>
            <div class="teacher-checkbox-list">
              @for (group of groups(); track group.id) {
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

          <div class="teacher-form-field">
            <span class="checkmate-label">Evidencia</span>
            <app-file-upload
              title="Haz clic para subir una foto o documento"
              description="JPG, PNG o PDF, maximo 5MB."
              accept="image/png,image/jpeg,application/pdf"
              [maxSizeMb]="5"
              (filesSelected)="selectEvidence($event)"
              (fileRemoved)="clearEvidence()"
            />
          </div>

          <button type="submit" class="teacher-jump-button" [disabled]="saving()">
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              Registrando...
            } @else {
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              Registrar incidente
            }
          </button>
        </section>
      </form>
    </section>
  `,
})
export class TeacherNewIncidentComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly saving = signal(false);
  protected readonly incidentTypes = INCIDENT_TYPES;
  protected readonly groups = signal<TeacherGroupView[]>([]);
  protected readonly selectedGroupIds = signal<string[]>([]);
  private evidence: File | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    incidentType: ['FIRE', Validators.required],
    title: ['', [Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(500)]],
    severity: ['', []],
  });

  ngOnInit(): void {
    this.teacherApi
      .getGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => this.groups.set(groups));
  }

  protected selectType(value: (typeof INCIDENT_TYPES)[number]['value']): void {
    this.form.controls.incidentType.setValue(value);
  }

  protected isGroupSelected(groupId: string): boolean {
    return this.selectedGroupIds().includes(groupId);
  }

  protected toggleGroup(groupId: string): void {
    this.selectedGroupIds.update((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  protected selectEvidence(files: File[]): void {
    this.evidence = files[0] ?? null;
  }

  protected clearEvidence(): void {
    this.evidence = null;
  }

  protected errorFor(controlName: TeacherIncidentControl, label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected submit(): void {
    markFormGroupTouched(this.form);

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    this.teacherApi
      .createIncident({
        type: value.incidentType,
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
        next: () => {
          this.toastService.success('Incidente registrado', 'Continua con la verificacion de alumnos.');
          void this.router.navigateByUrl(`${this.incidentBaseRoute()}/emergency-list`);
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo registrar',
            apiErrorMessage(error, 'No se pudo registrar el incidente. Intenta nuevamente.'),
          );
        },
      });
  }

  private incidentBaseRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/incidents' : '/teacher/incidents';
  }
}
