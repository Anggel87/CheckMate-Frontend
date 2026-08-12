import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import { StudentPortalApiService } from '../../../student-portal/data-access/student-portal-api.service';

type StudentJustificationControl = 'type' | 'reason';

@Component({
  selector: 'app-new-justification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormValidationMessageComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/justifications/select-absence">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Crear Justificante
      </a>

      <p class="student-page-intro">
        Envia la documentacion necesaria para justificar tu inasistencia.
      </p>

      <form class="student-card student-form-card" [formGroup]="form" (ngSubmit)="submit()">
        <div class="student-form-grid">
          <label class="student-form-field" for="justification-type">
            <span class="checkmate-label">Tipo de justificante <span>*</span></span>
            <div class="student-input-with-icon">
              <i class="fa-solid fa-shapes" aria-hidden="true"></i>
              <select
                id="justification-type"
                class="checkmate-select"
                formControlName="type"
                [class.is-invalid]="errorFor('type', 'Tipo de justificante')"
                [attr.aria-describedby]="'justification-type-error'"
              >
                <option value="">Selecciona un tipo</option>
                <option value="Medico">Medico</option>
                <option value="Personal">Personal</option>
                <option value="Academico">Academico</option>
              </select>
            </div>
            <app-form-validation-message
              id="justification-type-error"
              [message]="errorFor('type', 'Tipo de justificante')"
            />
          </label>
        </div>

        <label class="student-form-field" for="justification-reason">
          <span class="checkmate-label">Motivo detallado <span>*</span></span>
          <textarea
            id="justification-reason"
            class="checkmate-textarea"
            placeholder="Describe brevemente la razon de tu ausencia..."
            formControlName="reason"
            [class.is-invalid]="errorFor('reason', 'Motivo detallado')"
            [attr.aria-describedby]="'justification-reason-error'"
          ></textarea>
          <app-form-validation-message
            id="justification-reason-error"
            [message]="errorFor('reason', 'Motivo detallado')"
          />
        </label>

        <section class="student-evidence-section">
          <h2>Adjuntar Evidencia</h2>
          <p>Adjunta evidencia para respaldar tu justificante.</p>

          <label class="student-file-drop" for="justification-file">
            <input id="justification-file" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="selectFile($event)" />
            <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
              <i class="fa-regular fa-file-arrow-up"></i>
            </span>
            <strong>{{ evidenceName() || 'Haz clic para subir un archivo' }}</strong>
            <small>PDF, JPG o PNG (Max. 5MB)</small>
          </label>
        </section>

        <footer class="student-form-actions">
          <a class="btn-checkmate btn-checkmate-secondary" routerLink="/student/justifications"
            >Descartar</a
          >
          <button
            type="submit"
            class="btn-checkmate btn-checkmate-primary"
            [disabled]="form.invalid || saving()"
          >
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              <span>Enviando...</span>
            } @else {
              <span>Enviar Justificante</span>
            }
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class NewJustificationComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly saving = signal(false);
  protected readonly evidenceName = signal('');
  private evidence: File | null = null;
  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  protected errorFor(controlName: StudentJustificationControl, label: string): string {
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

    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    const attendanceId = this.route.snapshot.queryParamMap.get('attendanceId');

    if (!subjectId || !attendanceId) {
      this.toastService.error(
        'Selecciona una falta',
        'Debes elegir una falta justificable antes de enviar el formulario.',
      );
      return;
    }

    if (!this.evidence) {
      this.toastService.warning('Evidencia requerida', 'Adjunta un PDF, JPG o PNG para continuar.');
      return;
    }

    const value = this.form.getRawValue();
    const reason = `${value.type}. ${value.reason}`;

    this.saving.set(true);
    this.studentApi
      .createJustification(subjectId, attendanceId, reason, this.evidence)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success(
            'Justificante enviado',
            'Tu solicitud quedo registrada para revision.',
          );
          void this.router.navigateByUrl('/student/justifications');
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo enviar el justificante',
            apiErrorMessage(error, 'No se pudo enviar la solicitud. Revisa la falta y el archivo.'),
          );
        },
      });
  }
}
