import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

type TutorJustificationControl = 'studentId' | 'attendanceRecordId' | 'type' | 'reason';

const JUSTIFICATION_TYPES = [
  { value: 'Medico', label: 'Medico', icon: 'fa-solid fa-kit-medical' },
  { value: 'Laboral', label: 'Laboral', icon: 'fa-solid fa-briefcase' },
  { value: 'Otro', label: 'Otro', icon: 'fa-solid fa-ellipsis' },
] as const;

@Component({
  selector: 'app-tutor-new-justification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormValidationMessageComponent],
  template: `
    <section class="teacher-page tutor-new-justification-page">
      <a class="student-back-link" routerLink="/tutor/justifications">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a justificantes
      </a>

      <header class="teacher-page__header">
        <div>
          <h1>Nuevo justificante</h1>
          <p>Completa el formulario para registrar la justificacion de una ausencia.</p>
        </div>
      </header>

      <form class="teacher-card tutor-form-card" [formGroup]="form" (ngSubmit)="submit()">
        <label class="teacher-form-field" for="tutor-justification-student">
          <span class="checkmate-label">Alumno a justificar <span>*</span></span>
          <select
            id="tutor-justification-student"
            class="checkmate-select"
            formControlName="studentId"
            [class.is-invalid]="errorFor('studentId', 'Alumno')"
            (change)="syncAttendanceSelection()"
          >
            <option value="">Selecciona alumno</option>
            @for (student of students(); track student.id) {
              <option [value]="student.id">{{ student.name }} - {{ student.group }}</option>
            }
          </select>
          <app-form-validation-message [message]="errorFor('studentId', 'Alumno')" />
        </label>

        <label class="teacher-form-field" for="tutor-justification-attendance">
          <span class="checkmate-label">Ausencia a justificar <span>*</span></span>
          <select
            id="tutor-justification-attendance"
            class="checkmate-select"
            formControlName="attendanceRecordId"
            [class.is-invalid]="errorFor('attendanceRecordId', 'Ausencia')"
          >
            <option value="">Selecciona registro</option>
            @for (record of attendanceOptions(); track record.id) {
              <option [value]="record.id">{{ record.subject }} - {{ record.date }} - {{ record.status }}</option>
            }
          </select>
          <app-form-validation-message [message]="errorFor('attendanceRecordId', 'Ausencia')" />
        </label>

        <fieldset class="tutor-segmented-field">
          <legend class="checkmate-label">Tipo de justificacion <span>*</span></legend>
          <div class="tutor-segmented-actions">
            @for (type of justificationTypes; track type.value) {
              <button
                type="button"
                class="btn-checkmate"
                [class.btn-checkmate-primary]="form.controls.type.value === type.value"
                [class.btn-checkmate-secondary]="form.controls.type.value !== type.value"
                [attr.aria-pressed]="form.controls.type.value === type.value"
                (click)="form.controls.type.setValue(type.value)"
              >
                <i [class]="type.icon" aria-hidden="true"></i>
                {{ type.label }}
              </button>
            }
          </div>
          <app-form-validation-message [message]="errorFor('type', 'Tipo de justificacion')" />
        </fieldset>

        <label class="teacher-form-field" for="tutor-justification-reason">
          <span class="checkmate-label">Motivo detallado <span>*</span></span>
          <textarea
            id="tutor-justification-reason"
            class="checkmate-textarea"
            placeholder="Describe brevemente la razon de la ausencia..."
            formControlName="reason"
            [class.is-invalid]="errorFor('reason', 'Motivo detallado')"
          ></textarea>
          <app-form-validation-message [message]="errorFor('reason', 'Motivo detallado')" />
        </label>

        <section class="student-evidence-section">
          <div class="tutor-form-section-header">
            <h2>Evidencia adjunta</h2>
            <span>Opcional pero recomendado</span>
          </div>
          <label class="student-file-drop" for="tutor-justification-file">
            <input id="tutor-justification-file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
            <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
            <strong>Haz clic para subir o arrastra y suelta</strong>
            <small>PNG, JPG, PDF (Max. 5MB)</small>
          </label>
        </section>

        <footer class="student-form-actions">
          <a class="btn-checkmate btn-checkmate-secondary" routerLink="/tutor/justifications">Cancelar</a>
          <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="saving()">
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              Enviando...
            } @else {
              <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
              Enviar justificante
            }
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class TutorNewJustificationComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly students = this.tutoringData.students;
  protected readonly saving = signal(false);
  protected readonly justificationTypes = JUSTIFICATION_TYPES;
  protected readonly form = this.formBuilder.nonNullable.group({
    studentId: [this.route.snapshot.queryParamMap.get('student') ?? '', Validators.required],
    attendanceRecordId: [
      this.route.snapshot.queryParamMap.get('attendance') ?? '',
      Validators.required,
    ],
    type: ['Medico', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });
  protected attendanceOptions() {
    const studentId = this.form.controls.studentId.value;
    return studentId
      ? this.tutoringData.attendanceForStudent(studentId)
      : this.tutoringData.attendanceRecords();
  }

  protected syncAttendanceSelection(): void {
    const currentRecord = this.form.controls.attendanceRecordId.value;
    const valid = this.attendanceOptions().some((record) => record.id === currentRecord);

    if (!valid) {
      this.form.controls.attendanceRecordId.setValue('');
    }
  }

  protected errorFor(controlName: TutorJustificationControl, label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected async submit(): Promise<void> {
    markFormGroupTouched(this.form);

    if (this.form.invalid || this.saving()) {
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Registrar justificante?',
      message: 'La API actual no documenta creacion de justificantes desde tutor. Solo permite revisar justificantes existentes.',
      confirmText: 'Entendido',
      cancelText: 'Cancelar',
      variant: 'default',
      icon: 'fa-regular fa-file-lines',
    });

    if (!confirmed) {
      return;
    }

    this.toastService.error(
      'Endpoint no disponible',
      'Crea el justificante desde el portal del alumno y revisalo aqui cuando aparezca en la API.',
    );
  }
}
