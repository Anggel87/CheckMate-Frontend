import { Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { AuthService } from '../../../../core/authentication/auth.service';
import { UserRole } from '../../../../core/enums/user-role.enum';
import {
  NotificationOption,
  NotificationRecipientChannel,
  NotificationTargetOptions,
  NotificationTargetType,
  NotificationsApiService,
} from '../../data-access/notifications-api.service';

type RecipientChannel = 'TUTOR' | 'STUDENT_APP' | 'TEACHER_APP';
type Scope = 'ALL' | 'CAREER' | 'GROUP' | 'STUDENT';

const NOTIFICATION_TYPES = [
  { value: 'AVISO', label: 'Aviso general' },
  { value: 'INCIDENTE', label: 'Incidente' },
  { value: 'RECLAMO', label: 'Reclamo' },
] as const;

@Component({
  selector: 'app-compose-notification',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    CardComponent,
    FormValidationMessageComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <section class="management-page">
      <app-page-header
        title="Nueva Notificacion"
        description="Envia un aviso a alumnos, profesores o tutores familiares."
      />

      @if (loadingOptions()) {
      <app-loading-spinner label="Cargando destinatarios..." [showLabel]="true" />
    } @else {
      <form (ngSubmit)="submit()" [formGroup]="form">
        <app-card>
          <label class="checkmate-form-field" for="notification-title">
            <span class="checkmate-label">Titulo</span>
            <input
              id="notification-title"
              class="checkmate-input"
              type="text"
              formControlName="title"
              [class.is-invalid]="errorFor('title', 'Titulo')"
            />
            <app-form-validation-message [message]="errorFor('title', 'Titulo')" />
          </label>

          <label class="checkmate-form-field" for="notification-message">
            <span class="checkmate-label">Mensaje</span>
            <textarea
              id="notification-message"
              class="checkmate-textarea"
              formControlName="message"
              [class.is-invalid]="errorFor('message', 'Mensaje')"
            ></textarea>
            <app-form-validation-message [message]="errorFor('message', 'Mensaje')" />
          </label>

          <label class="checkmate-form-field" for="notification-type">
            <span class="checkmate-label">Tipo</span>
            <select id="notification-type" class="checkmate-select" formControlName="type">
              @for (option of notificationTypes; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </label>
        </app-card>

        <app-card>
          <h2>A quien va dirigido</h2>
          <div class="teacher-checkbox-list">
            <label class="checkmate-checkbox">
              <input
                type="radio"
                name="channel"
                [checked]="channel() === 'TUTOR'"
                (change)="setChannel('TUTOR')"
              />
              <span>Tutores familiares (por WhatsApp)</span>
            </label>
            <label class="checkmate-checkbox">
              <input
                type="radio"
                name="channel"
                [checked]="channel() === 'STUDENT_APP'"
                (change)="setChannel('STUDENT_APP')"
              />
              <span>Alumnos, directamente en la app</span>
            </label>
            <label class="checkmate-checkbox">
              <input
                type="radio"
                name="channel"
                [checked]="channel() === 'TEACHER_APP'"
                (change)="setChannel('TEACHER_APP')"
              />
              <span>Profesores, directamente en la app</span>
            </label>
          </div>
        </app-card>

        @if (channel() === 'TUTOR' || channel() === 'STUDENT_APP') {
          <app-card>
            <h2>Alcance</h2>
            <div class="teacher-checkbox-list">
              @if (isAdmin()) {
                <label class="checkmate-checkbox">
                  <input type="radio" name="scope" [checked]="scope() === 'ALL'" (change)="setScope('ALL')" />
                  <span>Toda la escuela</span>
                </label>
              }
              <label class="checkmate-checkbox">
                <input type="radio" name="scope" [checked]="scope() === 'CAREER'" (change)="setScope('CAREER')" />
                <span>{{ isAdmin() ? 'Por carrera' : 'Toda mi carrera' }}</span>
              </label>
              <label class="checkmate-checkbox">
                <input type="radio" name="scope" [checked]="scope() === 'GROUP'" (change)="setScope('GROUP')" />
                <span>Por salon/grupo</span>
              </label>
              <label class="checkmate-checkbox">
                <input type="radio" name="scope" [checked]="scope() === 'STUDENT'" (change)="setScope('STUDENT')" />
                <span>Alumno(s) especifico(s)</span>
              </label>
            </div>
          </app-card>

          @if (scope() === 'CAREER' && isAdmin()) {
            <app-card>
              <h2>Selecciona la(s) carrera(s)</h2>
              <input
                class="checkmate-input"
                type="search"
                placeholder="Buscar carrera..."
                (input)="careerFilter.set(inputValue($event))"
              />
              <div class="teacher-checkbox-list">
                @for (career of filteredCareers(); track career.id) {
                  <label class="checkmate-checkbox">
                    <input
                      type="checkbox"
                      [checked]="isSelected(selectedCareerIds(), career.id)"
                      (change)="toggle(selectedCareerIds, career.id)"
                    />
                    <span>{{ career.label }}</span>
                  </label>
                } @empty {
                  <p class="dropdown-empty">Sin carreras.</p>
                }
              </div>
            </app-card>
          }

          @if (scope() === 'GROUP') {
            <app-card>
              <h2>Selecciona el/los grupo(s)</h2>
              <input
                class="checkmate-input"
                type="search"
                placeholder="Buscar grupo..."
                (input)="groupFilter.set(inputValue($event))"
              />
              <div class="teacher-checkbox-list">
                @for (group of filteredGroups(); track group.id) {
                  <label class="checkmate-checkbox">
                    <input
                      type="checkbox"
                      [checked]="isSelected(selectedGroupIds(), group.id)"
                      (change)="toggle(selectedGroupIds, group.id)"
                    />
                    <span>{{ group.label }}</span>
                  </label>
                } @empty {
                  <p class="dropdown-empty">Sin grupos.</p>
                }
              </div>
            </app-card>
          }

          @if (scope() === 'STUDENT') {
            <app-card>
              <h2>Selecciona el/los alumno(s)</h2>
              <input
                class="checkmate-input"
                type="search"
                placeholder="Buscar alumno..."
                (input)="studentFilter.set(inputValue($event))"
              />
              <div class="teacher-checkbox-list">
                @for (student of filteredStudents(); track student.id) {
                  <label class="checkmate-checkbox">
                    <input
                      type="checkbox"
                      [checked]="isSelected(selectedStudentIds(), student.id)"
                      (change)="toggle(selectedStudentIds, student.id)"
                    />
                    <span>{{ student.label }}</span>
                  </label>
                } @empty {
                  <p class="dropdown-empty">Sin alumnos.</p>
                }
              </div>
            </app-card>
          }
        }

        @if (channel() === 'TEACHER_APP') {
          <app-card>
            <h2>Selecciona el/los profesor(es)</h2>
            <input
              class="checkmate-input"
              type="search"
              placeholder="Buscar profesor..."
              (input)="teacherFilter.set(inputValue($event))"
            />
            <div class="teacher-checkbox-list">
              @for (teacher of filteredTeachers(); track teacher.id) {
                <label class="checkmate-checkbox">
                  <input
                    type="checkbox"
                    [checked]="isSelected(selectedTeacherIds(), teacher.id)"
                    (change)="toggle(selectedTeacherIds, teacher.id)"
                  />
                  <span>{{ teacher.label }}</span>
                </label>
              } @empty {
                <p class="dropdown-empty">Sin profesores.</p>
              }
            </div>
          </app-card>
        }

        <footer class="student-form-actions">
          <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['..']">Cancelar</a>
          <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              <span>Enviando...</span>
            } @else {
              <span>Enviar Notificacion</span>
            }
          </button>
        </footer>
      </form>
      }
    </section>
  `,
})
export class ComposeNotificationComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly notificationsApi = inject(NotificationsApiService);

  protected readonly notificationTypes = NOTIFICATION_TYPES;
  protected readonly loadingOptions = signal(true);
  protected readonly saving = signal(false);
  protected readonly isAdmin = computed(() => this.authService.currentUser()?.role === UserRole.ADMIN);

  protected readonly channel = signal<RecipientChannel>('TUTOR');
  protected readonly scope = signal<Scope>('STUDENT');

  protected readonly careers = signal<NotificationOption[]>([]);
  protected readonly groups = signal<NotificationOption[]>([]);
  protected readonly students = signal<NotificationOption[]>([]);
  protected readonly teachers = signal<NotificationOption[]>([]);

  protected readonly careerFilter = signal('');
  protected readonly groupFilter = signal('');
  protected readonly studentFilter = signal('');
  protected readonly teacherFilter = signal('');

  protected readonly selectedCareerIds = signal<string[]>([]);
  protected readonly selectedGroupIds = signal<string[]>([]);
  protected readonly selectedStudentIds = signal<string[]>([]);
  protected readonly selectedTeacherIds = signal<string[]>([]);

  protected readonly filteredCareers = computed(() => this.filterOptions(this.careers(), this.careerFilter()));
  protected readonly filteredGroups = computed(() => this.filterOptions(this.groups(), this.groupFilter()));
  protected readonly filteredStudents = computed(() => this.filterOptions(this.students(), this.studentFilter()));
  protected readonly filteredTeachers = computed(() => this.filterOptions(this.teachers(), this.teacherFilter()));

  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(90)]],
    message: ['', [Validators.required, Validators.maxLength(350)]],
    type: ['AVISO', Validators.required],
  });

  constructor() {
    this.notificationsApi
      .getTargetOptions()
      .pipe(
        finalize(() => this.loadingOptions.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((options: NotificationTargetOptions) => {
        this.careers.set(options.careers);
        this.groups.set(options.groups);
        this.students.set(options.students);
        this.teachers.set(options.teachers);
      });
  }

  protected setChannel(value: RecipientChannel): void {
    this.channel.set(value);
  }

  protected setScope(value: Scope): void {
    this.scope.set(value);
  }

  protected isSelected(list: string[], id: string): boolean {
    return list.includes(id);
  }

  protected toggle(list: WritableSignal<string[]>, id: string): void {
    list.update((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected errorFor(controlName: 'title' | 'message', label: string): string {
    return controlErrorMessage(this.form.controls[controlName], label);
  }

  protected submit(): void {
    markFormGroupTouched(this.form);

    if (this.form.invalid) {
      return;
    }

    const target = this.resolveTarget();

    if (!target) {
      this.toastService.warning('Selecciona un destinatario', 'Debes indicar a quien va dirigido el aviso.');
      return;
    }

    const value = this.form.getRawValue();

    this.saving.set(true);
    this.notificationsApi
      .createNotification({
        title: value.title,
        message: value.message,
        type: value.type,
        target: target.target,
        recipientType: target.recipientType,
        careerIds: target.careerIds,
        groupIds: target.groupIds,
        studentIds: target.studentIds,
        teacherIds: target.teacherIds,
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Notificacion enviada', 'El aviso se envio correctamente.');
          void this.router.navigateByUrl(this.listRoute());
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo enviar',
            apiErrorMessage(error, 'Revisa los datos e intenta de nuevo.'),
          );
        },
      });
  }

  private resolveTarget(): {
    target: NotificationTargetType;
    recipientType?: NotificationRecipientChannel;
    careerIds?: string[];
    groupIds?: string[];
    studentIds?: string[];
    teacherIds?: string[];
  } | null {
    if (this.channel() === 'TEACHER_APP') {
      return this.selectedTeacherIds().length ? { target: 'TEACHER', teacherIds: this.selectedTeacherIds() } : null;
    }

    const recipientType: NotificationRecipientChannel = this.channel() === 'STUDENT_APP' ? 'STUDENT' : 'TUTOR';

    if (this.scope() === 'ALL') {
      return { target: 'ALL', recipientType };
    }

    if (this.scope() === 'CAREER') {
      if (this.isAdmin()) {
        return this.selectedCareerIds().length
          ? { target: 'CAREER', recipientType, careerIds: this.selectedCareerIds() }
          : null;
      }

      // El director no elige carrera: siempre es la suya, resuelta por el backend.
      return { target: 'CAREER', recipientType };
    }

    if (this.scope() === 'GROUP') {
      return this.selectedGroupIds().length
        ? { target: 'GROUP', recipientType, groupIds: this.selectedGroupIds() }
        : null;
    }

    return this.selectedStudentIds().length
      ? { target: 'STUDENT', recipientType, studentIds: this.selectedStudentIds() }
      : null;
  }

  private filterOptions(options: NotificationOption[], term: string): NotificationOption[] {
    const normalized = term.trim().toLowerCase();
    return normalized ? options.filter((option) => option.label.toLowerCase().includes(normalized)) : options;
  }

  private listRoute(): string {
    return this.authService.currentUser()?.role === UserRole.CAREER_DIRECTOR
      ? '/director/notifications'
      : '/admin/notifications';
  }
}
