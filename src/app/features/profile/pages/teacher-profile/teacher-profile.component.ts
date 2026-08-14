import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/authentication/auth.service';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import {
  EMPTY_TEACHER_PROFILE,
  TeacherPortalApiService,
  TeacherProfileView,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingSpinnerComponent, FileUploadComponent, FormValidationMessageComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mi Informacion</h1>
          <p>Consulta y gestiona tu perfil.</p>
        </div>

        @if (!loading() && !editing()) {
          <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="startEditing()">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
            <span>Editar Datos</span>
          </button>
        }
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando perfil..." [showLabel]="true" />
      } @else {
        <article class="student-card student-profile-card">
          <img
            class="student-profile-card__avatar"
            [src]="profile().avatarUrl"
            [alt]="'Foto de perfil de ' + profile().name"
          />

          <div class="student-profile-card__content">
            <h2>{{ profile().name }}</h2>
            <p>{{ profile().role }}</p>

            @if (profile().tutoredGroups.length) {
              <div class="student-chip-row">
                <span class="student-info-chip">
                  <i class="fa-solid fa-users" aria-hidden="true"></i>
                  <span>Grupos tutorados</span>
                  <strong>{{ profile().tutoredGroups.join(', ') }}</strong>
                </span>
              </div>
            }
          </div>
        </article>

        @if (editing()) {
          <form class="student-card student-form-card" [formGroup]="editForm" (ngSubmit)="save()">
            <header>
              <h2>Editar mis datos</h2>
              <p>Solo puedes actualizar tu foto de perfil y tu telefono.</p>
            </header>

            <label class="student-form-field" for="profile-phone">
              <span class="checkmate-label">Telefono Movil</span>
              <input
                id="profile-phone"
                class="checkmate-input"
                type="tel"
                formControlName="phone"
                [class.is-invalid]="errorFor('phone')"
              />
              <app-form-validation-message [message]="errorFor('phone')" />
            </label>

            <div class="student-form-field">
              <span class="checkmate-label">Foto de Perfil</span>
              <app-file-upload
                title="Haz clic para subir una foto"
                description="JPG o PNG, maximo 3MB."
                accept="image/png,image/jpeg"
                [maxSizeMb]="3"
                (filesSelected)="selectPhoto($event)"
                (fileRemoved)="clearPhoto()"
              />
            </div>

            <footer class="student-form-actions">
              <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancelEditing()">
                Cancelar
              </button>
              <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="editForm.invalid || saving()">
                @if (saving()) {
                  <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar cambios</span>
                }
              </button>
            </footer>
          </form>
        }

        <article class="student-card student-contact-card">
          <header>
            <h2>Informacion de Contacto</h2>
          </header>

          <div class="student-contact-grid">
            <label>
              <span>
                <i class="fa-regular fa-envelope" aria-hidden="true"></i>
                Correo Institucional
              </span>
              <input class="checkmate-input" type="email" [value]="profile().email" readonly />
            </label>

            <label>
              <span>
                <i class="fa-solid fa-phone" aria-hidden="true"></i>
                Telefono Movil
              </span>
              <input class="checkmate-input" type="tel" [value]="profile().phone" readonly />
            </label>
          </div>
        </article>
      }
    </section>
  `,
})
export class TeacherProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);
  private readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly profile = signal<TeacherProfileView>(EMPTY_TEACHER_PROFILE);

  private photo: File | null = null;

  protected readonly editForm = this.formBuilder.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
  });

  constructor() {
    this.teacherApi
      .getProfile()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profile) => {
        this.profile.set(profile);
        this.authService.updateProfileSummary(profile.avatarUrl, profile.shortName);
      });
  }

  protected errorFor(controlName: 'phone'): string {
    return controlErrorMessage(this.editForm.controls[controlName], 'Telefono');
  }

  protected startEditing(): void {
    this.editForm.reset({ phone: this.profile().phone });
    this.photo = null;
    this.editing.set(true);
  }

  protected cancelEditing(): void {
    this.editing.set(false);
    this.photo = null;
  }

  protected selectPhoto(files: File[]): void {
    this.photo = files[0] ?? null;
  }

  protected clearPhoto(): void {
    this.photo = null;
  }

  protected save(): void {
    markFormGroupTouched(this.editForm);

    if (this.editForm.invalid) {
      return;
    }

    const { phone } = this.editForm.getRawValue();

    this.saving.set(true);
    this.teacherApi
      .updateProfile(phone, this.photo)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.authService.updateProfileSummary(profile.avatarUrl, profile.shortName);
          this.editing.set(false);
          this.photo = null;
          this.toastService.success('Perfil actualizado', 'Tus datos se guardaron correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo actualizar tu perfil',
            apiErrorMessage(error, 'Revisa los datos e intenta de nuevo.'),
          );
        },
      });
  }
}
