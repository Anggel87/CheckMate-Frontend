import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';

type StudentClaimControl = 'attendanceRecord' | 'reason' | 'description';

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
        <label class="student-form-field" for="claim-record">
          <span class="checkmate-label">Registro de Asistencia <span>*</span></span>
          <div class="student-input-with-icon">
            <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
            <select
              id="claim-record"
              class="checkmate-select"
              formControlName="attendanceRecord"
              [class.is-invalid]="errorFor('attendanceRecord', 'Registro de asistencia')"
              [attr.aria-describedby]="'claim-record-error'"
            >
              <option value="">Selecciona el registro a reclamar</option>
              <option value="att-2023-09-28">28/Sep/2023 - Base de datos</option>
              <option value="att-2023-09-27">27/Sep/2023 - Redes</option>
              <option value="att-2023-09-24">24/Sep/2023 - Redes</option>
            </select>
          </div>
          <app-form-validation-message
            id="claim-record-error"
            [message]="errorFor('attendanceRecord', 'Registro de asistencia')"
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
              <option value="wrong-status">Estado incorrecto</option>
              <option value="missing-register">No aparece mi registro</option>
              <option value="teacher-comment">Observacion incorrecta</option>
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
            <input id="claim-file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
            <strong>Arrastra y suelta tus archivos aqui</strong>
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
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    attendanceRecord: ['', Validators.required],
    reason: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  protected errorFor(controlName: StudentClaimControl, label: string): string {
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
        'Reclamo enviado',
        'Tu solicitud quedo registrada para seguimiento.',
      );
      void this.router.navigateByUrl('/student/claims');
    }, 500);
  }
}
