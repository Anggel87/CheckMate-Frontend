import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';

type StudentJustificationControl = 'type' | 'dateRange' | 'reason';

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
                <option value="medical">Medico</option>
                <option value="personal">Personal</option>
                <option value="academic">Academico</option>
              </select>
            </div>
            <app-form-validation-message
              id="justification-type-error"
              [message]="errorFor('type', 'Tipo de justificante')"
            />
          </label>

          <label class="student-form-field" for="justification-dates">
            <span class="checkmate-label">Rango de fechas <span>*</span></span>
            <div class="student-input-with-icon">
              <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
              <input
                id="justification-dates"
                class="checkmate-input"
                type="text"
                placeholder="Seleccionar fechas"
                formControlName="dateRange"
                [class.is-invalid]="errorFor('dateRange', 'Rango de fechas')"
                [attr.aria-describedby]="'justification-dates-error justification-dates-help'"
              />
            </div>
            <small id="justification-dates-help"
              >Aplica para los dias que no pudiste asistir.</small
            >
            <app-form-validation-message
              id="justification-dates-error"
              [message]="errorFor('dateRange', 'Rango de fechas')"
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
          <p>Sube una receta medica, comprobante o documento que avale tu solicitud.</p>

          <label class="student-file-drop" for="justification-file">
            <input id="justification-file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
              <i class="fa-regular fa-file-arrow-up"></i>
            </span>
            <strong>Haz clic para subir un archivo</strong>
            <small>o arrastra y suelta aqui</small>
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
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['', Validators.required],
    dateRange: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected errorFor(controlName: StudentJustificationControl, label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected submit(): void {
    markFormGroupTouched(this.form);

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    window.setTimeout(() => {
      this.saving.set(false);
      this.toastService.success(
        'Justificante enviado',
        'Tu solicitud quedo registrada para revision.',
      );
      void this.router.navigateByUrl('/student/justifications');
    }, 500);
  }
}
