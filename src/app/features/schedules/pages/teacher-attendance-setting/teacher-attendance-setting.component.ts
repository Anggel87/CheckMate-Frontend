import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { TeacherPortalApiService } from '../../../teacher-portal/data-access/teacher-portal-api.service';

const DAY_LABELS: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miercoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sabado',
  DOMINGO: 'Domingo',
};

@Component({
  selector: 'app-teacher-attendance-setting',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="teacher-page teacher-attendance-setting-page">
      @if (loading()) {
        <app-loading-spinner label="Cargando configuracion..." [showLabel]="true" />
      } @else {
        <header class="teacher-page__header">
          <div>
            <h1>Tolerancia de asistencia</h1>
            <p>{{ subject() }} - {{ group() }} ({{ dayLabel() }} {{ time() }})</p>
          </div>
        </header>

        <form class="checkmate-card management-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="management-form__grid">
            <label class="checkmate-form-field">
              <span class="checkmate-label">Tolerancia a tiempo (minutos)</span>
              <input class="checkmate-input" type="number" min="0" max="255" formControlName="presentToleranceMinutes" />
              <p class="teacher-field-hint">Hasta este numero de minutos tarde, la asistencia cuenta como PRESENTE.</p>
            </label>
            <label class="checkmate-form-field">
              <span class="checkmate-label">Tolerancia de retardo (minutos)</span>
              <input class="checkmate-input" type="number" min="0" max="255" formControlName="lateToleranceMinutes" />
              <p class="teacher-field-hint">Hasta este numero de minutos tarde, cuenta como RETARDO. Despues de este punto, el tap del alumno ya no es valido.</p>
              @if (form.controls.lateToleranceMinutes.touched && form.errors?.['lateNotGreater']) {
                <p class="checkmate-field-error">La tolerancia de retardo debe ser mayor a la de asistencia a tiempo.</p>
              }
            </label>
          </div>
          <footer class="management-form__footer">
            @if (isCustom()) {
              <button
                type="button"
                class="btn-checkmate btn-checkmate-secondary"
                [disabled]="submitting()"
                (click)="resetToDefaults()"
              >
                Restablecer a valores por defecto
              </button>
            }
            <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="backRoute()">Cancelar</a>
            <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
              Guardar cambios
            </button>
          </footer>
        </form>
      }
    </section>
  `,
})
export class TeacherAttendanceSettingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly teacherApi = inject(TeacherPortalApiService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly isCustom = signal(false);
  protected readonly subject = signal('');
  protected readonly group = signal('');
  protected readonly day = signal('');
  protected readonly time = signal('');

  protected readonly form = new FormGroup(
    {
      presentToleranceMinutes: new FormControl(10, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(255)],
      }),
      lateToleranceMinutes: new FormControl(30, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0), Validators.max(255)],
      }),
    },
    {
      validators: (group) => {
        const present = group.get('presentToleranceMinutes')?.value ?? 0;
        const late = group.get('lateToleranceMinutes')?.value ?? 0;
        return late > present ? null : { lateNotGreater: true };
      },
    },
  );

  private readonly scheduleId = this.route.snapshot.paramMap.get('scheduleId') ?? '';

  constructor() {
    this.teacherApi
      .getAttendanceSetting(this.scheduleId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (setting) => {
          this.isCustom.set(setting.id !== null);
          this.subject.set(setting.subject);
          this.group.set(setting.group);
          this.day.set(setting.day);
          this.time.set(setting.time);
          this.form.patchValue({
            presentToleranceMinutes: setting.presentToleranceMinutes,
            lateToleranceMinutes: setting.lateToleranceMinutes,
          });
        },
        error: (error) => {
          this.toastService.error('No se pudo cargar', apiErrorMessage(error, 'Intenta nuevamente.'));
        },
      });
  }

  protected dayLabel(): string {
    return DAY_LABELS[this.day()] ?? this.day();
  }

  protected backRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/schedule' : '/teacher/schedule';
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.submitting.set(true);
    this.teacherApi
      .updateAttendanceSetting(this.scheduleId, raw.presentToleranceMinutes, raw.lateToleranceMinutes)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (setting) => {
          this.isCustom.set(true);
          this.toastService.success('Configuracion guardada', 'La tolerancia de esta clase fue actualizada.');
          this.form.patchValue({
            presentToleranceMinutes: setting.presentToleranceMinutes,
            lateToleranceMinutes: setting.lateToleranceMinutes,
          });
        },
        error: (error) => {
          this.toastService.error('No se pudo guardar', apiErrorMessage(error, 'Verifica los datos e intenta nuevamente.'));
        },
      });
  }

  protected async resetToDefaults(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Restablecer tolerancia',
      message: 'Esta clase volvera a usar la tolerancia por defecto (10 minutos para asistencia, 30 para retardo).',
      confirmText: 'Restablecer',
      variant: 'danger',
      icon: 'fa-regular fa-clock',
    });

    if (!confirmed) {
      return;
    }

    this.submitting.set(true);
    this.teacherApi
      .resetAttendanceSetting(this.scheduleId)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (setting) => {
          this.isCustom.set(false);
          this.form.patchValue({
            presentToleranceMinutes: setting.presentToleranceMinutes,
            lateToleranceMinutes: setting.lateToleranceMinutes,
          });
          this.toastService.success('Restablecido', 'Esta clase vuelve a usar la tolerancia por defecto.');
        },
        error: (error) => {
          this.toastService.error('No se pudo restablecer', apiErrorMessage(error, 'Intenta nuevamente.'));
        },
      });
  }
}
