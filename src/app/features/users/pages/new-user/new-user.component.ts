import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import {
  GroupOptionView,
  NewUserRole,
  NewUserTutorPayload,
  UsersApiService,
} from '../../data-access/users-api.service';

const ROLE_OPTIONS: { value: NewUserRole; label: string }[] = [
  { value: 'alumno', label: 'Alumno' },
  { value: 'profesor', label: 'Profesor' },
  { value: 'tutor_academico', label: 'Tutor academico' },
  { value: 'director_carrera', label: 'Director de carrera' },
  { value: 'administrador', label: 'Administrador' },
];

const ROLES_WITH_NFC: NewUserRole[] = ['alumno', 'profesor', 'tutor_academico'];

function emptyTutor(isPrimary: boolean): NewUserTutorPayload {
  return {
    firstName: '',
    secondName: '',
    firstSurname: '',
    secondSurname: '',
    phone: '',
    relationship: '',
    isPrimary,
  };
}

@Component({
  selector: 'app-new-user',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PageHeaderComponent],
  template: `
    <section class="management-page">
      <app-page-header
        title="Nuevo usuario"
        description="Crea una cuenta para cualquier rol. Los permisos los define el rol elegido, no hace falta configurarlos por usuario."
      />

      <form class="checkmate-card management-form" [formGroup]="form" (ngSubmit)="submit()">
        <div class="management-form__grid">
          <label class="checkmate-form-field">
            <span class="checkmate-label">Rol</span>
            <select class="checkmate-select" [ngModel]="role()" [ngModelOptions]="{ standalone: true }" (ngModelChange)="role.set($event)">
              @for (option of roleOptions; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Nombre</span>
            <input class="checkmate-input" type="text" formControlName="firstName" />
            @if (form.controls.firstName.touched && form.controls.firstName.invalid) {
              <p class="checkmate-field-error">Debes indicar el nombre.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Segundo nombre (opcional)</span>
            <input class="checkmate-input" type="text" formControlName="secondName" />
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Apellido paterno</span>
            <input class="checkmate-input" type="text" formControlName="firstSurname" />
            @if (form.controls.firstSurname.touched && form.controls.firstSurname.invalid) {
              <p class="checkmate-field-error">Debes indicar el apellido paterno.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Apellido materno</span>
            <input class="checkmate-input" type="text" formControlName="secondSurname" />
            @if (form.controls.secondSurname.touched && form.controls.secondSurname.invalid) {
              <p class="checkmate-field-error">Debes indicar el apellido materno.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Correo</span>
            <input class="checkmate-input" type="email" formControlName="email" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="checkmate-field-error">Ingresa un correo valido.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Telefono</span>
            <input class="checkmate-input" type="text" formControlName="phone" placeholder="10 digitos" />
            @if (form.controls.phone.touched && form.controls.phone.invalid) {
              <p class="checkmate-field-error">El telefono debe tener 10 digitos.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Fecha de nacimiento</span>
            <input class="checkmate-input" type="date" formControlName="birthDate" />
            @if (form.controls.birthDate.touched && form.controls.birthDate.invalid) {
              <p class="checkmate-field-error">Indica la fecha de nacimiento.</p>
            }
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Genero</span>
            <select class="checkmate-select" formControlName="gender">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label class="checkmate-form-field">
            <span class="checkmate-label">Foto (opcional)</span>
            <input class="checkmate-input" type="file" accept="image/png,image/jpeg" (change)="onPhotoSelected($event)" />
          </label>

          @if (role() === 'alumno') {
            <label class="checkmate-form-field">
              <span class="checkmate-label">Grupo</span>
              <select class="checkmate-select" formControlName="groupId">
                <option value="" disabled>Selecciona un grupo</option>
                @for (group of groups(); track group.id) {
                  <option [value]="group.id">{{ group.label }}</option>
                }
              </select>
              @if (form.controls.groupId.touched && form.controls.groupId.invalid) {
                <p class="checkmate-field-error">Selecciona el grupo del alumno.</p>
              }
            </label>
          }

          @if (showsNfcField()) {
            <label class="checkmate-form-field">
              <span class="checkmate-label">UID de tarjeta NFC (opcional)</span>
              <input class="checkmate-input" type="text" formControlName="nfcUid" placeholder="Dejar en blanco si no aplica" />
            </label>
          }
        </div>

        @if (role() === 'alumno') {
          <div class="management-form__test-tools">
            <div>
              <strong>Tutores legales</strong>
              <p class="teacher-field-hint">Opcional. El primero de la lista queda como tutor principal.</p>
            </div>
            <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="addTutor()">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Agregar tutor
            </button>
          </div>

          @for (tutor of tutors(); track $index) {
            <div class="checkmate-card management-form__grid" style="margin-bottom: 12px;">
              <label class="checkmate-form-field">
                <span class="checkmate-label">Nombre del tutor</span>
                <input
                  class="checkmate-input"
                  type="text"
                  [ngModel]="tutor.firstName"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'firstName', $event)"
                />
              </label>
              <label class="checkmate-form-field">
                <span class="checkmate-label">Apellido paterno</span>
                <input
                  class="checkmate-input"
                  type="text"
                  [ngModel]="tutor.firstSurname"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'firstSurname', $event)"
                />
              </label>
              <label class="checkmate-form-field">
                <span class="checkmate-label">Apellido materno</span>
                <input
                  class="checkmate-input"
                  type="text"
                  [ngModel]="tutor.secondSurname"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'secondSurname', $event)"
                />
              </label>
              <label class="checkmate-form-field">
                <span class="checkmate-label">Telefono (WhatsApp)</span>
                <input
                  class="checkmate-input"
                  type="text"
                  [ngModel]="tutor.phone"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'phone', $event)"
                  placeholder="10 digitos"
                />
              </label>
              <label class="checkmate-form-field">
                <span class="checkmate-label">Parentesco</span>
                <input
                  class="checkmate-input"
                  type="text"
                  [ngModel]="tutor.relationship"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'relationship', $event)"
                  placeholder="Madre, Padre, Tutor..."
                />
              </label>
              <label class="checkmate-form-field checkmate-form-field--checkbox">
                <input
                  class="checkmate-checkbox"
                  type="checkbox"
                  [ngModel]="tutor.isPrimary"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="updateTutor($index, 'isPrimary', $event)"
                />
                <span class="checkmate-label">Tutor principal</span>
              </label>
              <div class="management-form__full">
                <button type="button" class="btn-checkmate btn-checkmate-danger" (click)="removeTutor($index)">
                  Quitar tutor
                </button>
              </div>
            </div>
          }
        }

        <footer class="management-form__footer">
          <button class="btn-checkmate btn-checkmate-primary" type="submit" [disabled]="submitting()">
            Crear usuario
          </button>
        </footer>
      </form>
    </section>
  `,
})
export class NewUserComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersApi = inject(UsersApiService);
  private readonly toastService = inject(ToastService);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly role = signal<NewUserRole>('alumno');
  protected readonly submitting = signal(false);
  protected readonly groups = signal<GroupOptionView[]>([]);
  protected readonly tutors = signal<NewUserTutorPayload[]>([]);
  protected selectedPhoto: File | null = null;

  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    secondName: new FormControl('', { nonNullable: true }),
    firstSurname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    secondSurname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{10}$/)] }),
    birthDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    gender: new FormControl('M', { nonNullable: true, validators: [Validators.required] }),
    groupId: new FormControl('', { nonNullable: true }),
    nfcUid: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.usersApi
      .getGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => this.groups.set(groups));
  }

  protected showsNfcField(): boolean {
    return ROLES_WITH_NFC.includes(this.role());
  }

  protected onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPhoto = input.files?.[0] ?? null;
  }

  protected addTutor(): void {
    this.tutors.update((current) => [...current, emptyTutor(current.length === 0)]);
  }

  protected removeTutor(index: number): void {
    this.tutors.update((current) => current.filter((_, i) => i !== index));
  }

  protected updateTutor(index: number, field: keyof NewUserTutorPayload, value: string | boolean): void {
    this.tutors.update((current) => current.map((tutor, i) => (i === index ? { ...tutor, [field]: value } : tutor)));
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      this.toastService.error('Faltan datos', 'Completa los campos requeridos antes de guardar.');
      return;
    }

    if (this.role() === 'alumno' && !this.form.controls.groupId.value) {
      this.form.controls.groupId.markAsTouched();
      this.toastService.error('Falta el grupo', 'Selecciona el grupo del alumno.');
      return;
    }

    const invalidTutor = this.tutors().find(
      (tutor) => !tutor.firstName || !tutor.firstSurname || !tutor.secondSurname || !tutor.relationship || !/^\d{10}$/.test(tutor.phone),
    );

    if (invalidTutor) {
      this.toastService.error('Revisa a los tutores', 'Completa nombre, apellidos, telefono (10 digitos) y parentesco de cada tutor agregado.');
      return;
    }

    const raw = this.form.getRawValue();

    this.submitting.set(true);
    this.usersApi
      .createUser({
        role: this.role(),
        firstName: raw.firstName,
        secondName: raw.secondName || undefined,
        firstSurname: raw.firstSurname,
        secondSurname: raw.secondSurname,
        email: raw.email,
        phone: raw.phone,
        birthDate: raw.birthDate,
        gender: raw.gender,
        photo: this.selectedPhoto,
        groupId: this.role() === 'alumno' ? raw.groupId : undefined,
        nfcUid: this.showsNfcField() && raw.nfcUid ? raw.nfcUid : undefined,
        tutors: this.role() === 'alumno' ? this.tutors() : undefined,
      })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (created) => {
          this.toastService.success(
            'Usuario creado',
            created.temporaryPassword
              ? `${created.fullName} fue creado. Contrasena temporal: ${created.temporaryPassword}`
              : `${created.fullName} fue creado correctamente.`,
          );
          this.resetForm();
        },
        error: (error) => {
          this.toastService.error('No se pudo crear el usuario', apiErrorMessage(error, 'Verifica los datos e intenta nuevamente.'));
        },
      });
  }

  private resetForm(): void {
    this.form.reset({ gender: 'M', groupId: '', nfcUid: '', firstName: '', secondName: '', firstSurname: '', secondSurname: '', email: '', phone: '', birthDate: '' });
    this.tutors.set([]);
    this.selectedPhoto = null;
  }
}
