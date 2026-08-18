import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  applyServerErrors,
  controlErrorMessage,
  markFormGroupTouched,
} from '../../../../shared/utils/form.utils';
import { apiErrorMessage, apiFieldErrors } from '../../../../shared/utils/api-error.util';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';
import { TutorStudent } from '../../../tutoring/models/tutoring.model';

type TutorJustificationControl = 'studentId' | 'attendanceRecordId' | 'type' | 'reason';

const JUSTIFICATION_TYPES = [
  { value: 'Medico', label: 'Medico', icon: 'fa-solid fa-kit-medical' },
  { value: 'Laboral', label: 'Laboral', icon: 'fa-solid fa-briefcase' },
  { value: 'Otro', label: 'Otro', icon: 'fa-solid fa-ellipsis' },
] as const;

@Component({
  selector: 'app-tutor-new-justification',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormValidationMessageComponent, FileUploadComponent],
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
        <div class="tutor-student-picker-filters">
          <label class="teacher-form-field tutor-combobox-field" for="tutor-justification-student">
            <span class="checkmate-label">Alumno a justificar <span>*</span></span>
            <div class="tutor-combobox">
              <input
                id="tutor-justification-student"
                class="checkmate-input"
                type="text"
                autocomplete="off"
                placeholder="Escribe el nombre del alumno..."
                [class.is-invalid]="errorFor('studentId', 'Alumno')"
                [value]="studentQuery()"
                (input)="onStudentQueryInput($event)"
                (focus)="studentPanelOpen.set(true)"
                (blur)="studentPanelOpen.set(false)"
              />
              @if (studentPanelOpen()) {
                <ul class="tutor-combobox-panel">
                  @for (student of filteredStudents(); track student.id) {
                    <li>
                      <button type="button" (mousedown)="$event.preventDefault()" (click)="selectStudent(student)">
                        {{ student.name }} - {{ student.group }}
                      </button>
                    </li>
                  } @empty {
                    <li class="dropdown-empty">Ningun alumno coincide con la busqueda.</li>
                  }
                </ul>
              }
            </div>
            <app-form-validation-message [message]="errorFor('studentId', 'Alumno')" />
          </label>

          <label class="teacher-form-field">
            <span class="checkmate-label">Grupo</span>
            <select class="checkmate-select" (change)="studentGroupFilter.set(inputValue($event))">
              <option value="Todos">Todos los grupos</option>
              @for (group of studentGroups(); track group) {
                <option [value]="group">{{ group }}</option>
              }
            </select>
          </label>
        </div>

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
              <option [value]="record.id">{{ record.subject }} - {{ record.date }}</option>
            }
          </select>
          @if (form.controls.studentId.value && attendanceOptions().length === 0) {
            <p class="teacher-help-note">Este alumno no tiene faltas pendientes de justificar.</p>
          }
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
          <app-file-upload
            title="Haz clic para subir o arrastra y suelta"
            description="Adjunta evidencia para respaldar el justificante."
            accept="image/png,image/jpeg,application/pdf"
            [maxSizeMb]="5"
            (filesSelected)="selectFile($event)"
            (fileRemoved)="clearEvidence()"
          />
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly students = this.tutoringData.students;
  protected readonly studentQuery = signal('');
  protected readonly studentPanelOpen = signal(false);
  protected readonly studentGroupFilter = signal('Todos');
  protected readonly studentGroups = computed(() =>
    Array.from(new Set(this.students().map((student) => student.group))),
  );
  protected readonly filteredStudents = computed(() => {
    const term = this.studentQuery().trim().toLowerCase();
    const group = this.studentGroupFilter();

    return this.students().filter((student) => {
      const matchesGroup = group === 'Todos' || student.group === group;
      const matchesTerm = term.length === 0 || student.name.toLowerCase().includes(term);

      return matchesGroup && matchesTerm;
    });
  });
  protected readonly saving = signal(false);
  private evidence: File | null = null;
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

  constructor() {
    const studentId = this.form.controls.studentId.value;

    if (studentId) {
      this.tutoringData.loadStudentAttendance(studentId);

      const preselected = this.students().find((student) => student.id === studentId);

      if (preselected) {
        this.studentQuery.set(`${preselected.name} - ${preselected.group}`);
      }
    }
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected onStudentQueryInput(event: Event): void {
    this.studentQuery.set(this.inputValue(event));
    this.studentPanelOpen.set(true);

    if (this.form.controls.studentId.value) {
      this.form.controls.studentId.setValue('');
      this.syncAttendanceSelection();
    }
  }

  protected selectStudent(student: TutorStudent): void {
    this.form.controls.studentId.setValue(student.id);
    this.studentQuery.set(`${student.name} - ${student.group}`);
    this.studentPanelOpen.set(false);
    this.syncAttendanceSelection();
  }

  protected attendanceOptions() {
    const studentId = this.form.controls.studentId.value;

    if (!studentId) {
      return [];
    }

    return this.tutoringData
      .attendanceForStudent(studentId)
      .filter((record) => record.status === 'Inasistencia');
  }

  protected syncAttendanceSelection(): void {
    const studentId = this.form.controls.studentId.value;

    if (studentId) {
      this.tutoringData.loadStudentAttendance(studentId);
    }

    const currentRecord = this.form.controls.attendanceRecordId.value;
    const valid = this.attendanceOptions().some((record) => record.id === currentRecord);

    if (!valid) {
      this.form.controls.attendanceRecordId.setValue('');
    }
  }

  protected errorFor(controlName: TutorJustificationControl, label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected selectFile(files: File[]): void {
    this.evidence = files[0] ?? null;
  }

  protected clearEvidence(): void {
    this.evidence = null;
  }

  protected async submit(): Promise<void> {
    markFormGroupTouched(this.form);

    if (this.form.invalid || this.saving()) {
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Registrar justificante?',
      message: 'El justificante quedara pendiente hasta que lo revises desde la lista de justificantes.',
      confirmText: 'Enviar',
      cancelText: 'Cancelar',
      variant: 'default',
      icon: 'fa-regular fa-file-lines',
    });

    if (!confirmed) {
      return;
    }

    const value = this.form.getRawValue();
    const reason = `${value.type}. ${value.reason}`;

    this.saving.set(true);
    this.tutoringData
      .createJustification(value.studentId, value.attendanceRecordId, reason, this.evidence)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Justificante enviado', 'Quedo registrado para revision.');
          void this.router.navigateByUrl('/tutor/justifications');
        },
        error: (error: HttpErrorResponse) => {
          const fieldErrors = apiFieldErrors(error);

          if (fieldErrors) {
            applyServerErrors(this.form, fieldErrors);
          }

          this.toastService.error(
            'No se pudo enviar el justificante',
            apiErrorMessage(error, 'Verifica el alumno, la ausencia seleccionada y vuelve a intentar.'),
          );
        },
      });
  }
}
