import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import { StudentPortalApiService } from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-edit-justification',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FormValidationMessageComponent,
    FileUploadComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="student-page">
      <a class="student-back-link" [routerLink]="['/student/justifications', justificationId]">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver al Justificante
      </a>

      <header class="student-page__header">
        <div>
          <h1>Editar Justificante</h1>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando justificante..." [showLabel]="true" />
      } @else {
        <form
          class="student-card student-form-card student-form-card--narrow"
          [formGroup]="form"
          (ngSubmit)="submit()"
        >
          <label class="student-form-field" for="justification-reason">
            <span class="checkmate-label">Motivo detallado <span>*</span></span>
            <textarea
              id="justification-reason"
              class="checkmate-textarea"
              formControlName="reason"
              [class.is-invalid]="errorFor()"
              [attr.aria-describedby]="'justification-reason-error'"
            ></textarea>
            <app-form-validation-message id="justification-reason-error" [message]="errorFor()" />
          </label>

          <section class="student-evidence-section">
            <h2>Evidencia <small>(Opcional reemplazar)</small></h2>
            <app-file-upload
              title="Haz clic para subir un archivo"
              description="Deja este campo vacio para conservar la evidencia actual."
              accept="image/png,image/jpeg,application/pdf"
              [maxSizeMb]="5"
              [currentFileUrl]="evidenceUrl()"
              (filesSelected)="selectFile($event)"
              (fileRemoved)="clearEvidence()"
            />
          </section>

          <footer class="student-form-actions">
            <a
              class="btn-checkmate btn-checkmate-secondary"
              [routerLink]="['/student/justifications', justificationId]"
              >Cancelar</a
            >
            <button
              type="submit"
              class="btn-checkmate btn-checkmate-primary"
              [disabled]="form.invalid || saving()"
            >
              @if (saving()) {
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                <span>Guardando...</span>
              } @else {
                <span>Guardar Cambios</span>
              }
            </button>
          </footer>
        </form>
      }
    </section>
  `,
})
export class EditJustificationComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly justificationId = this.route.snapshot.paramMap.get('justificationId') ?? '';
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly evidenceUrl = signal('');
  private evidence: File | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  constructor() {
    this.studentApi
      .getJustificationDetail(this.justificationId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.form.patchValue({ reason: detail.reason });
        this.evidenceUrl.set(detail.evidenceUrl);
      });
  }

  protected errorFor(): string {
    return controlErrorMessage(this.form.controls.reason, 'Motivo detallado');
  }

  protected selectFile(files: File[]): void {
    this.evidence = files[0] ?? null;
  }

  protected clearEvidence(): void {
    this.evidence = null;
  }

  protected submit(): void {
    markFormGroupTouched(this.form);

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.studentApi
      .updateJustification(this.justificationId, this.form.getRawValue().reason, this.evidence)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Justificante actualizado', 'Los cambios se guardaron correctamente.');
          void this.router.navigate(['/student/justifications', this.justificationId]);
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo actualizar',
            apiErrorMessage(error, 'Es posible que ya haya sido revisado. Intenta recargar la pagina.'),
          );
        },
      });
  }
}
