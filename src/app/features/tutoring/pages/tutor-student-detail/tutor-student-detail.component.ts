import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import { TutoringDataService } from '../../data-access/tutoring-data.service';
import { TutorAttendanceRecord, TutorAttendanceStatus } from '../../models/tutoring.model';

type CalendarDay = { number: string; dayNumber: number; isToday: boolean; dotClassName: string };

@Component({
  selector: 'app-tutor-student-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, ReactiveFormsModule, FormValidationMessageComponent],
  template: `
    <section class="teacher-page teacher-student-profile-page">
      <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
        <a routerLink="/tutor/dashboard">Dashboard</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <a routerLink="/tutor/students">Alumnos</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Perfil del alumno</strong>
      </nav>

      <article class="teacher-card teacher-student-hero">
        @if (student().avatarUrl) {
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
        } @else {
          <span class="avatar tutor-profile-avatar">{{ student().initials }}</span>
        }
        <div>
          <h1>{{ student().name }}</h1>
          <div class="badge-row">
            <app-status-badge [label]="'Grupo ' + student().group" tone="danger" />
            <app-status-badge [label]="'Departamento ' + student().department" tone="neutral" />
          </div>
          <dl class="teacher-student-hero__stats">
            <div>
              <dt>Asistencia</dt>
              <dd>{{ student().attendanceRate }}%</dd>
            </div>
            <div>
              <dt>Justificantes</dt>
              <dd>{{ student().justificationCount }}</dd>
            </div>
          </dl>
        </div>
        <div class="tutor-profile-actions">
          <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/tutor/students', student().id, 'attendance']">
            <i class="fa-regular fa-calendar-check" aria-hidden="true"></i>
            Ver asistencias
          </a>
          <a class="btn-checkmate btn-checkmate-primary" [href]="'mailto:' + student().email">
            <i class="fa-regular fa-envelope" aria-hidden="true"></i>
            Contactar
          </a>
        </div>
      </article>

      <nav class="teacher-profile-tabs" aria-label="Secciones del alumno">
        <a class="is-active" [routerLink]="['/tutor/students', student().id]">Asistencias</a>
        <a [routerLink]="['/tutor/students', student().id, 'justifications']">Justificantes</a>
      </nav>

      <div class="teacher-profile-layout">
        <div class="teacher-profile-main">
          <section class="teacher-card teacher-attendance-calendar-small">
            <header>
              <h2>Historial de Asistencia - {{ monthLabel() }}</h2>
              <div>
                <button type="button" class="icon-button" aria-label="Mes anterior" (click)="goToPreviousMonth()">
                  <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button type="button" class="icon-button" aria-label="Mes siguiente" (click)="goToNextMonth()">
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <p class="teacher-help-note">Elige un dia para ver el horario de clases y si el alumno asistio.</p>
            <div class="tutor-calendar-weekdays" aria-hidden="true">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mie</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sab</span>
            </div>
            <div class="teacher-mini-calendar tutor-hour-calendar" aria-label="Calendario de asistencia">
              @for (day of calendarDays(); track $index) {
                <button
                  type="button"
                  class="tutor-calendar-day"
                  [class.is-empty]="!day.number"
                  [class.is-today]="day.isToday"
                  [class.is-selected]="day.dayNumber !== 0 && selectedDay() === day.dayNumber"
                  [disabled]="!day.number"
                  (click)="selectDay(day)"
                >
                  @if (day.number) {
                    <span class="tutor-calendar-day__number">{{ day.number }}</span>
                    @if (day.dotClassName) {
                      <span [class]="'tutor-calendar-day__dot ' + day.dotClassName"></span>
                    }
                  }
                </button>
              }
            </div>
            <footer>
              <span><i class="fa-solid fa-circle"></i> Presente</span>
              <span><i class="fa-solid fa-circle is-red"></i> Falta</span>
              <span><i class="fa-solid fa-circle is-muted"></i> Justificado</span>
              <span><i class="fa-solid fa-circle is-warning"></i> Retardo</span>
            </footer>

            @if (selectedDay(); as day) {
              <div class="tutor-day-detail">
                <h3>{{ selectedDayLabel() }}</h3>

                @if (selectedDayRecords().length) {
                  <ul class="tutor-day-detail__list">
                    @for (record of selectedDayRecords(); track record.id) {
                      <li>
                        <div>
                          <strong>{{ record.subject }}</strong>
                          <span>{{ record.classTimeRange }}</span>
                          @if (record.checkInDelayLabel) {
                            <small>{{ record.checkInDelayLabel }}</small>
                          }
                        </div>
                        <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="dropdown-empty">El alumno no tuvo clases registradas ese dia.</p>
                }
              </div>
            }
          </section>

          <section class="teacher-card teacher-activity-card">
            <header>
              <h2>Actividad Reciente</h2>
              <a [routerLink]="['/tutor/students', student().id, 'attendance']">Ver todo</a>
            </header>
            <div class="teacher-activity-list">
              @for (item of recentActivity(); track item.id) {
                <article [class.is-danger]="item.status === 'Inasistencia'">
                  <i [class]="activityIcon(item.status)" aria-hidden="true"></i>
                  <div>
                    <strong>{{ activityLabel(item.status) }}</strong>
                    <span>{{ item.subject }} - {{ item.classTimeRange }}</span>
                    @if (item.checkInDelayLabel) {
                      <small>{{ item.checkInDelayLabel }}</small>
                    }
                  </div>
                  <time>{{ item.date }}</time>
                </article>
              } @empty {
                <p class="dropdown-empty">Sin actividad reciente registrada.</p>
              }
            </div>
          </section>
        </div>

        <aside class="teacher-side-stack">
          <section class="teacher-card teacher-student-details-card">
            <h2><i class="fa-regular fa-user" aria-hidden="true"></i> Detalles del alumno</h2>
            <dl>
              <div>
                <dt>ID de alumno</dt>
                <dd>{{ student().enrollment }}</dd>
              </div>
              <div>
                <dt>Correo institucional</dt>
                <dd>{{ student().email }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{{ student().status }}</dd>
              </div>
            </dl>
          </section>

          <section class="teacher-card teacher-student-tutors-card">
            <h2><i class="fa-solid fa-user-shield" aria-hidden="true"></i> Tutores Legales</h2>

            @if (student().tutors.length) {
              @for (tutor of student().tutors; track tutor.id) {
                <div class="management-tutor-row">
                  <div>
                    <strong>{{ tutor.fullName }}</strong>
                    <small>{{ tutor.relationship }}{{ tutor.isPrimary ? ' - Principal' : '' }}</small>
                  </div>
                  <span>{{ tutor.phone || 'Sin telefono' }}</span>
                </div>
              }
            } @else {
              <p class="dropdown-empty">Sin tutores legales registrados.</p>
            }

            <div class="tutor-legal-actions">
              <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="toggleMessage()">
                <i class="fa-regular fa-paper-plane" aria-hidden="true"></i>
                Enviar mensaje
              </button>
            </div>

            @if (sendingMessage()) {
              <form class="tutor-inline-form" [formGroup]="messageForm" (ngSubmit)="submitMessage()">
                <label class="teacher-form-field" for="message-title">
                  <span class="checkmate-label">Titulo del aviso</span>
                  <input id="message-title" class="checkmate-input" type="text" formControlName="title" />
                  <app-form-validation-message [message]="messageError('title', 'Titulo')" />
                </label>
                <label class="teacher-form-field" for="message-body">
                  <span class="checkmate-label">Mensaje</span>
                  <textarea id="message-body" class="checkmate-textarea" formControlName="message"></textarea>
                  <app-form-validation-message [message]="messageError('message', 'Mensaje')" />
                </label>
                <p class="teacher-help-note">
                  Se enviara a todos los tutores del alumno que tengan notificaciones activas (WhatsApp y aviso en la
                  app).
                </p>
                <footer class="student-form-actions">
                  <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="toggleMessage()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="sendingRequest()">
                    @if (sendingRequest()) {
                      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                      Enviando...
                    } @else {
                      Enviar
                    }
                  </button>
                </footer>
              </form>
            }
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TutorStudentDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly viewYear = signal(new Date().getFullYear());
  protected readonly viewMonth = signal(new Date().getMonth());
  protected readonly selectedDay = signal<number | null>(new Date().getDate());

  protected readonly sendingMessage = signal(false);
  protected readonly sendingRequest = signal(false);

  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );

  constructor() {
    const studentId = this.route.snapshot.paramMap.get('studentId');

    if (studentId) {
      this.tutoringData.loadStudentTutors(studentId);
      this.tutoringData.loadStudentAttendance(studentId);
    }
  }

  protected readonly messageForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(90)]],
    message: ['', [Validators.required, Validators.maxLength(350)]],
  });

  protected readonly monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
      new Date(this.viewYear(), this.viewMonth(), 1),
    );

    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  private readonly recordsByDay = computed(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const records = this.tutoringData.attendanceForStudent(this.student().id);
    const map = new Map<number, TutorAttendanceRecord[]>();

    records.forEach((record) => {
      if (!record.rawDate) {
        return;
      }

      const parsed = new Date(record.rawDate);

      if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() !== month) {
        return;
      }

      const day = parsed.getDate();
      const dayRecords = map.get(day) ?? [];
      dayRecords.push(record);
      map.set(day, dayRecords);
    });

    return map;
  });

  protected readonly calendarDays = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const recordsByDay = this.recordsByDay();
    const today = new Date();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const leadingDays = new Date(year, month, 1).getDay();
    const days: CalendarDay[] = [];

    for (let index = 0; index < leadingDays; index += 1) {
      days.push({ number: '', dayNumber: 0, isToday: false, dotClassName: '' });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const dayRecords = recordsByDay.get(day) ?? [];
      days.push({
        number: String(day),
        dayNumber: day,
        isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === day,
        dotClassName: this.worstStatusClassName(dayRecords),
      });
    }

    return days;
  });

  protected readonly selectedDayLabel = computed(() => {
    const day = this.selectedDay();

    if (day === null) {
      return '';
    }

    const label = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(
      new Date(this.viewYear(), this.viewMonth(), day),
    );

    return label.charAt(0).toUpperCase() + label.slice(1);
  });

  protected readonly selectedDayRecords = computed<TutorAttendanceRecord[]>(() => {
    const day = this.selectedDay();

    if (day === null) {
      return [];
    }

    return [...(this.recordsByDay().get(day) ?? [])].sort((a, b) => a.time.localeCompare(b.time));
  });

  protected readonly recentActivity = computed<TutorAttendanceRecord[]>(() =>
    [...this.tutoringData.attendanceForStudent(this.student().id)]
      .filter((record) => record.rawDate)
      .sort((a, b) => b.rawDate.localeCompare(a.rawDate))
      .slice(0, 3),
  );

  protected goToPreviousMonth(): void {
    this.shiftMonth(-1);
  }

  protected goToNextMonth(): void {
    this.shiftMonth(1);
  }

  protected selectDay(day: CalendarDay): void {
    if (!day.dayNumber) {
      return;
    }

    this.selectedDay.set(day.dayNumber);
  }

  protected activityIcon(status: TutorAttendanceStatus): string {
    if (status === 'Inasistencia') {
      return 'fa-regular fa-circle-xmark';
    }

    if (status === 'Retardo') {
      return 'fa-regular fa-clock';
    }

    if (status === 'Justificado') {
      return 'fa-regular fa-file-lines';
    }

    return 'fa-regular fa-circle-check';
  }

  protected activityLabel(status: TutorAttendanceStatus): string {
    if (status === 'Inasistencia') {
      return 'Inasistencia registrada';
    }

    if (status === 'Retardo') {
      return 'Retardo registrado';
    }

    if (status === 'Justificado') {
      return 'Justificante aplicado';
    }

    return 'Asistencia confirmada';
  }

  protected toggleMessage(): void {
    this.messageForm.reset({ title: '', message: '' });
    this.sendingMessage.update((value) => !value);
  }

  protected messageError(control: keyof typeof this.messageForm.controls, label: string): string {
    return controlErrorMessage(this.messageForm.controls[control], label);
  }

  protected submitMessage(): void {
    markFormGroupTouched(this.messageForm);

    if (this.messageForm.invalid) {
      return;
    }

    const value = this.messageForm.getRawValue();

    this.sendingRequest.set(true);
    this.tutoringData
      .notifyTutors(this.student().id, value.title, value.message)
      .pipe(
        finalize(() => this.sendingRequest.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (recipientsCount) => {
          this.toastService.success('Mensaje enviado', `Se notifico a ${recipientsCount} tutor(es).`);
          this.sendingMessage.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error('No se pudo enviar', apiErrorMessage(error, 'Intenta nuevamente.'));
        },
      });
  }

  private shiftMonth(delta: number): void {
    const date = new Date(this.viewYear(), this.viewMonth() + delta, 1);
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
    this.selectedDay.set(null);
  }

  private worstStatusClassName(records: readonly TutorAttendanceRecord[]): string {
    if (records.some((record) => record.status === 'Inasistencia')) {
      return 'is-absent';
    }

    if (records.some((record) => record.status === 'Retardo')) {
      return 'is-warning';
    }

    if (records.some((record) => record.status === 'Justificado')) {
      return 'is-muted';
    }

    if (records.length) {
      return 'is-present';
    }

    return '';
  }
}
