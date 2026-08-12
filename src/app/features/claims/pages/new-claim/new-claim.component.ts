import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import {
  StudentCourseView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

type StudentClaimControl = 'subjectId' | 'reason' | 'description';

@Component({
  selector: 'app-new-claim',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormValidationMessageComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/claims">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Mis Reclamos
      </a>

      <header class="student-page__header">
        <div>
          <h1>Crear Reclamo</h1>
        </div>
      </header>

      <form
        class="student-card student-form-card student-form-card--narrow"
        [formGroup]="form"
        (ngSubmit)="submit()"
      >
        <label class="student-form-field" for="claim-subject">
          <span class="checkmate-label">Materia <span>*</span></span>
          <div class="student-input-with-icon">
            <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
            <select
              id="claim-subject"
              class="checkmate-select"
              formControlName="subjectId"
              [class.is-invalid]="errorFor('subjectId', 'Materia')"
              [attr.aria-describedby]="'claim-subject-error'"
            >
              <option value="">Selecciona la materia a reclamar</option>
              @for (subject of subjects(); track subject.id) {
                <option [value]="subject.id">{{ subject.name }} - {{ subject.teacher }}</option>
              }
            </select>
          </div>
          <app-form-validation-message
            id="claim-subject-error"
            [message]="errorFor('subjectId', 'Materia')"
          />
        </label>

        <label class="student-form-field" for="claim-reason">
          <span class="checkmate-label">Motivo del Reclamo <span>*</span></span>
          <div class="student-input-with-icon">
            <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
            <select
              id="claim-reason"
              class="checkmate-select"
              formControlName="reason"
              [class.is-invalid]="errorFor('reason', 'Motivo del reclamo')"
              [attr.aria-describedby]="'claim-reason-error'"
            >
              <option value="">Selecciona un motivo</option>
              <option value="Estado incorrecto">Estado incorrecto</option>
              <option value="No aparece mi registro">No aparece mi registro</option>
              <option value="Observacion incorrecta">Observacion incorrecta</option>
            </select>
          </div>
          <app-form-validation-message
            id="claim-reason-error"
            [message]="errorFor('reason', 'Motivo del reclamo')"
          />
        </label>

        <label class="student-form-field" for="claim-description">
          <span class="checkmate-label">Descripcion Detallada <span>*</span></span>
          <textarea
            id="claim-description"
            class="checkmate-textarea"
            placeholder="Explica brevemente la situacion..."
            formControlName="description"
            [class.is-invalid]="errorFor('description', 'Descripcion detallada')"
            [attr.aria-describedby]="'claim-description-error'"
          ></textarea>
          <app-form-validation-message
            id="claim-description-error"
            [message]="errorFor('description', 'Descripcion detallada')"
          />
        </label>

        <section class="student-evidence-section">
          <h2>Adjuntar Evidencia <small>(Opcional)</small></h2>
          <label class="student-file-drop" for="claim-file">
            <input id="claim-file" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="selectFile($event)" />
            <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
            <strong>{{ evidenceName() || 'Arrastra y suelta tus archivos aqui' }}</strong>
            <small>o haz clic para explorar (JPG, PNG, PDF)</small>
          </label>
        </section>

        <footer class="student-form-actions">
          <a class="btn-checkmate btn-checkmate-secondary" routerLink="/student/claims">Cancelar</a>
          <button
            type="submit"
            class="btn-checkmate btn-checkmate-primary"
            [disabled]="form.invalid || saving()"
          >
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              <span>Enviando...</span>
            } @else {
              <span>Enviar Reclamo</span>
            }
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class NewClaimComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly saving = signal(false);
  protected readonly evidenceName = signal('');
  protected readonly subjects = signal<StudentCourseView[]>([]);
  private evidence: File | null = null;
  protected readonly form = this.formBuilder.nonNullable.group({
    subjectId: ['', Validators.required],
    reason: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  constructor() {
    this.studentApi
      .getSubjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((subjects) => {
        this.subjects.set(subjects);
      });
  }

  protected errorFor(controlName: StudentClaimControl, label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.evidence = input.files?.[0] ?? null;
    this.evidenceName.set(this.evidence?.name ?? '');
  }

  protected submit(): void {
    markFormGroupTouched(this.form);

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const description = `${value.reason}. ${value.description}`;

    this.saving.set(true);
    this.studentApi
      .createClaim(value.subjectId, description, this.evidence)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success(
            'Reclamo enviado',
            'Tu solicitud quedo registrada para seguimiento.',
          );
          void this.router.navigateByUrl('/student/claims');
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo enviar el reclamo',
            apiErrorMessage(error, 'Revisa los datos e intenta de nuevo.'),
          );
        },
      });
  }
}
