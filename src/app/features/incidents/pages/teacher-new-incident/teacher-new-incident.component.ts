import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import { TeacherPortalApiService } from '../../../teacher-portal/data-access/teacher-portal-api.service';

type TeacherIncidentControl = 'incidentType' | 'title' | 'description' | 'severity' | 'location';

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
] as const;

@Component({
  selector: 'app-teacher-new-incident',
  standalone: true,
  imports: [ReactiveFormsModule, FormValidationMessageComponent],
  template: `
    <section class="teacher-page teacher-new-incident-page">
      <header class="teacher-page__header">
        <div>
          <h1>Reportar Nuevo Incidente</h1>
          <p>
            Por favor, seleccione el tipo de emergencia para una respuesta inmediata. El sistema
            notificara automaticamente a los servicios correspondientes.
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
              <span><i [class]="type.icon" aria-hidden="true"></i></span>
              <strong>{{ type.label }}</strong>
              <small>{{ type.subtitle }}</small>
            </button>
          }
        </fieldset>

        <div class="teacher-form-layout">
          <section class="teacher-card teacher-incident-form-card">
            <h2>
              <i class="fa-solid fa-list-check" aria-hidden="true"></i> Detalles del Incidente
            </h2>

            <label class="teacher-form-field" for="incident-title">
              <span class="checkmate-label">Titulo del incidente <span>*</span></span>
              <input
                id="incident-title"
                class="checkmate-input"
                type="text"
                placeholder="Ej: Fuga de gas detectada en ala norte"
                formControlName="title"
                [class.is-invalid]="errorFor('title', 'Titulo del incidente')"
                aria-describedby="incident-title-error"
              />
              <app-form-validation-message
                id="incident-title-error"
                [message]="errorFor('title', 'Titulo del incidente')"
              />
            </label>

            <label class="teacher-form-field" for="incident-description">
              <span class="checkmate-label">Descripcion <span>*</span></span>
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

            <div class="teacher-form-grid">
              <label class="teacher-form-field" for="incident-severity">
                <span class="checkmate-label">Severidad <span>*</span></span>
                <select
                  id="incident-severity"
                  class="checkmate-select"
                  formControlName="severity"
                  [class.is-invalid]="errorFor('severity', 'Severidad')"
                  aria-describedby="incident-severity-error"
                >
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

              <label class="teacher-form-field" for="incident-location">
                <span class="checkmate-label">Ubicacion especifica <span>*</span></span>
                <input
                  id="incident-location"
                  class="checkmate-input"
                  type="text"
                  placeholder="Ej: Laboratorio 4, Piso 2"
                  formControlName="location"
                  [class.is-invalid]="errorFor('location', 'Ubicacion especifica')"
                  aria-describedby="incident-location-error"
                />
                <app-form-validation-message
                  id="incident-location-error"
                  [message]="errorFor('location', 'Ubicacion especifica')"
                />
              </label>
            </div>

            <button type="submit" class="teacher-jump-button" [disabled]="saving()">
              @if (saving()) {
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                Registrando...
              } @else {
                <i class="fa-solid fa-list" aria-hidden="true"></i>
                Saltar a lista
              }
            </button>
          </section>

          <aside class="teacher-side-stack">
            <article class="teacher-card teacher-emergency-protocol-box">
              <span><i class="fa-solid fa-circle-info" aria-hidden="true"></i></span>
              <h2>Protocolo de Emergencia</h2>
              <p>
                Al reportar un incidente critico, asegurese de evacuar el area antes de completar
                los detalles secundarios.
              </p>
              <ul>
                <li>Identifique el tipo de riesgo.</li>
                <li>Defina la severidad actual.</li>
                <li>Especifique el lugar exacto.</li>
              </ul>
            </article>

            <figure class="teacher-monitor-card">
              <img src="/img/lp/Lp3.webp" alt="Centro de monitoreo de seguridad en vivo" />
              <figcaption>Monitoreo en vivo activado</figcaption>
            </figure>
          </aside>
        </div>
      </form>
    </section>
  `,
})
export class TeacherNewIncidentComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly saving = signal(false);
  protected readonly incidentTypes = INCIDENT_TYPES;
  protected readonly form = this.formBuilder.nonNullable.group({
    incidentType: ['FIRE', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    severity: ['CRITICA', Validators.required],
    location: ['', [Validators.required, Validators.maxLength(160)]],
  });

  protected selectType(value: (typeof INCIDENT_TYPES)[number]['value']): void {
    this.form.controls.incidentType.setValue(value);
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
        description: `${value.description}\nUbicacion reportada: ${value.location}`,
        severity: value.severity,
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
