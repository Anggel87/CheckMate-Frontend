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
  selector: 'app-edit-claim',
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
      <a class="student-back-link" [routerLink]="['/student/claims', claimId]">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver al Reclamo
      </a>

      <header class="student-page__header">
        <div>
          <h1>Editar Reclamo</h1>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando reclamo..." [showLabel]="true" />
      } @else {
        <form
          class="student-card student-form-card student-form-card--narrow"
          [formGroup]="form"
          (ngSubmit)="submit()"
        >
          <label class="student-form-field" for="claim-description">
            <span class="checkmate-label">Descripcion Detallada <span>*</span></span>
            <textarea
              id="claim-description"
              class="checkmate-textarea"
              formControlName="description"
              [class.is-invalid]="errorFor()"
              [attr.aria-describedby]="'claim-description-error'"
            ></textarea>
            <app-form-validation-message id="claim-description-error" [message]="errorFor()" />
          </label>

          <section class="student-evidence-section">
            <h2>Evidencia <small>(Opcional)</small></h2>
            <app-file-upload
              title="Arrastra y suelta tus archivos aqui"
              description="o haz clic para explorar (JPG, PNG, PDF)"
              accept="image/png,image/jpeg,application/pdf"
              [maxSizeMb]="5"
              [currentFileUrl]="evidenceUrl()"
              (filesSelected)="selectFile($event)"
              (fileRemoved)="clearEvidence()"
            />
          </section>

          <footer class="student-form-actions">
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/student/claims', claimId]"
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
export class EditClaimComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly claimId = this.route.snapshot.paramMap.get('claimId') ?? '';
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly evidenceUrl = signal('');
  private evidence: File | null = null;

  protected readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  constructor() {
    this.studentApi
      .getClaimDetail(this.claimId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.form.patchValue({ description: detail.description });
        this.evidenceUrl.set(detail.evidenceUrl);
      });
  }

  protected errorFor(): string {
    return controlErrorMessage(this.form.controls.description, 'Descripcion detallada');
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
      .updateClaim(this.claimId, this.form.getRawValue().description, this.evidence)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Reclamo actualizado', 'Los cambios se guardaron correctamente.');
          void this.router.navigate(['/student/claims', this.claimId]);
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo actualizar',
            apiErrorMessage(error, 'Es posible que ya este siendo atendido. Intenta recargar la pagina.'),
          );
        },
      });
  }
}
