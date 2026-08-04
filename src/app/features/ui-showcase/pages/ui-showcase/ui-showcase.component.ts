import { Component, signal, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/components/error-state/error-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { TextInputComponent } from '../../../../shared/forms/text-input/text-input.component';

@Component({
  selector: 'app-ui-showcase',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    TableSkeletonComponent,
    TextInputComponent,
  ],
  template: `
    <section class="ui-showcase">
      <app-page-header
        title="UI Showcase"
        description="Validación visual de componentes globales para desarrollo."
      />

      <div class="showcase-grid">
        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Toasts</h2>
              <p>Alertas globales apilables.</p>
            </div>
          </div>

          <div class="button-grid">
            <button type="button" class="btn-checkmate btn-checkmate-success" (click)="showSuccessToast()">
              <i class="fa-solid fa-check" aria-hidden="true"></i>
              <span>Éxito</span>
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-info" (click)="showInfoToast()">
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
              <span>Información</span>
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-warning" (click)="showWarningToast()">
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
              <span>Advertencia</span>
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="showErrorToast()">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              <span>Error</span>
            </button>
          </div>
        </app-card>

        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Modales</h2>
              <p>Confirmación simple y doble confirmación.</p>
            </div>
          </div>

          <div class="button-grid">
            <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="openConfirmation()">
              <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              <span>Confirmar</span>
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="openDoubleConfirmation()">
              <i class="fa-solid fa-lock" aria-hidden="true"></i>
              <span>Doble confirmación</span>
            </button>
          </div>
        </app-card>

        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Formulario</h2>
              <p>Validación visual cercana al campo.</p>
            </div>
          </div>

          <form class="showcase-form" [formGroup]="form" (ngSubmit)="submitForm()">
            <app-text-input
              label="Nombre del alumno"
              formControlName="studentName"
              [required]="true"
              [errorMessage]="studentNameError()"
            />

            <button type="submit" class="btn-checkmate btn-checkmate-primary">
              <i class="fa-solid fa-floppy-disk" aria-hidden="true"></i>
              <span>Guardar</span>
            </button>
          </form>
        </app-card>

        <app-card>
          <div class="panel-heading">
            <div>
              <h2>Estados</h2>
              <p>Badges, loading y estados vacíos.</p>
            </div>
          </div>

          <div class="badge-row">
            <app-status-badge label="Presente" tone="present" icon="fa-solid fa-check" />
            <app-status-badge label="Retardo" tone="late" icon="fa-solid fa-clock" />
            <app-status-badge label="Falta" tone="absent" icon="fa-solid fa-xmark" />
            <app-status-badge label="Justificado" tone="justified" icon="fa-solid fa-file-circle-check" />
          </div>

          <app-loading-spinner label="Cargando información" [showLabel]="true" />
          <app-table-skeleton [rows]="4" />
        </app-card>

        <app-card>
          <app-empty-state
            icon="fa-solid fa-inbox"
            title="No hay actividad reciente."
            description="Cuando exista información aparecerá en este espacio."
          />
        </app-card>

        <app-card>
          <app-error-state
            title="No se pudieron cargar los alumnos"
            description="Verifica tu conexión e intenta nuevamente."
            (retry)="showInfoToast()"
          />
        </app-card>
      </div>
    </section>
  `,
})
export class UiShowcaseComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  protected readonly submitted = signal(false);
  protected readonly form = this.formBuilder.group({
    studentName: this.formBuilder.control('', [Validators.required]),
  });

  showSuccessToast(): void {
    this.toastService.success('Creado con éxito', 'El alumno fue creado correctamente.');
  }

  showInfoToast(): void {
    this.toastService.info('Información guardada', 'Los cambios se guardaron correctamente.');
  }

  showWarningToast(): void {
    this.toastService.warning('Atención', 'Hay alumnos pendientes de asistencia.');
  }

  showErrorToast(): void {
    this.toastService.error('Error al guardar', 'No se pudo guardar la información.');
  }

  async openConfirmation(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Eliminar alumno',
      message: 'Esta acción eliminará el registro del alumno y no se podrá deshacer.',
      icon: 'fa-solid fa-trash-can',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      this.toastService.success('Alumno eliminado', 'La acción fue confirmada correctamente.');
    }
  }

  async openDoubleConfirmation(): Promise<void> {
    const confirmed = await this.dialogService.doubleConfirm({
      title: '¿Estás completamente seguro?',
      message: 'Esta acción eliminará de forma permanente el grupo y toda su información relacionada.',
      warning: 'No podrás revertir esta acción.',
      confirmationTitle: 'Confirma para continuar',
      confirmationMessage: 'Escribe la palabra ELIMINAR para confirmar esta acción.',
      requiredText: 'ELIMINAR',
      continueText: 'Continuar',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (confirmed) {
      this.toastService.warning('Acción crítica confirmada', 'El flujo de doble confirmación finalizó correctamente.');
    }
  }

  submitForm(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      markFormGroupTouched(this.form);
      return;
    }

    this.toastService.success('Formulario válido', 'La validación visual funciona correctamente.');
  }

  studentNameError(): string {
    const control = this.form.controls.studentName;

    if (!this.submitted() && !(control.touched || control.dirty)) {
      return '';
    }

    return controlErrorMessage(control, 'El nombre del alumno');
  }
}
