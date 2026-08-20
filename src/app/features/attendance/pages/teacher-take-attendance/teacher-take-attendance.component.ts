import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import {
  AttendanceMark,
  TeacherAttendanceStudentView,
  TeacherClassView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';
import { toRecord, readNumber, readString } from '../../../../core/api/api-adapter';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';

@Component({
  selector: 'app-teacher-take-attendance',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page teacher-attendance-page">
      <header class="teacher-attendance-header">
        <div>
          <h1>Pasar Lista: {{ classItem()?.subject || 'Clase' }}</h1>
          <p>{{ classItem()?.group || 'Grupo' }} - {{ classItem()?.start }} a {{ classItem()?.end }}</p>
        </div>

        <div class="teacher-attendance-stats" aria-label="Resumen de asistencia">
          <article class="teacher-mini-stat">
            <span>Total alumnos</span>
            <strong>{{ students().length }}</strong>
          </article>
          <article class="teacher-mini-stat teacher-mini-stat--success">
            <span>Asistentes</span>
            <strong>{{ presentCount() }}</strong>
          </article>
        </div>

        <a class="btn-checkmate btn-checkmate-warning teacher-attendance-header__incident" [routerLink]="newIncidentRoute()">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          Nuevo Incidente
        </a>
      </header>

      @if (!loading() && !sessionOpen() && !sessionClosed()) {
        <section class="teacher-card teacher-session-waiting" aria-live="polite">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
          <div>
            <strong>Esperando tu check-in</strong>
            <p>La clase se abrira automaticamente al registrar tu tarjeta NFC en el salon.</p>
          </div>
          <button type="button" class="btn-checkmate btn-checkmate-secondary" [disabled]="opening()" (click)="openNow()">
            @if (opening()) {
              <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            }
            Abrir clase ahora
          </button>
        </section>
      }

      @if (sessionOpen()) {
        <span class="teacher-live-indicator">
          <i class="fa-solid fa-circle" aria-hidden="true"></i>
          En vivo
        </span>
      }

      @if (sessionClosed()) {
        <section class="teacher-card teacher-session-closed" aria-live="polite">
          <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
          Esta sesion ya fue cerrada.
        </section>
      }

      @if (sessionOpen()) {
        <section class="teacher-attendance-toolbar" aria-label="Acciones de pase de lista">
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="pendingModalOpen.set(true)">
            <i class="fa-solid fa-users" aria-hidden="true"></i>
            Alumnos sin checar ({{ pendingStudents().length }})
          </button>
        </section>
      }

      @if (!loading() && sessionOpen() && !visibleStudents().length) {
        <section class="teacher-card teacher-attendance-empty" aria-live="polite">
          <i class="fa-solid fa-user-clock" aria-hidden="true"></i>
          <div>
            <strong>Aun no llegan alumnos</strong>
            <p>Los alumnos apareceran aqui automaticamente conforme registren su tarjeta NFC.</p>
          </div>
        </section>
      }

      <section class="teacher-attendance-grid" aria-label="Alumnos">
        @for (student of visibleStudents(); track student.id) {
          <article
            class="teacher-attendance-card"
            [class.is-selected]="isSelected(student.id, 'present')"
            [class.is-just-checked-in]="recentlyUpdated().has(student.id)"
          >
            <button
              type="button"
              class="teacher-attendance-card__info"
              [attr.aria-label]="'Ver detalle de ' + student.name"
              (click)="infoStudentId.set(student.id)"
            >
              <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            </button>

            <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
            <h2>{{ student.name }}</h2>

            @if (student.disabled) {
              <span class="teacher-attendance-card__justified">Justificado</span>
            }

            <div class="teacher-mark-control" [class.is-disabled]="student.disabled || sessionClosed()">
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--absent"
                [class.is-active]="isSelected(student.id, 'absent')"
                [disabled]="student.disabled || sessionClosed()"
                [attr.aria-pressed]="isSelected(student.id, 'absent')"
                [attr.aria-label]="'Marcar falta para ' + student.name"
                (click)="onMarkClick(student.id, 'absent')"
              >
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--late"
                [class.is-active]="isSelected(student.id, 'late')"
                [disabled]="student.disabled || sessionClosed()"
                [attr.aria-pressed]="isSelected(student.id, 'late')"
                [attr.aria-label]="'Marcar retardo para ' + student.name"
                (click)="onMarkClick(student.id, 'late')"
              >
                <i class="fa-regular fa-clock" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--present"
                [class.is-active]="isSelected(student.id, 'present')"
                [disabled]="student.disabled || sessionClosed()"
                [attr.aria-pressed]="isSelected(student.id, 'present')"
                [attr.aria-label]="'Marcar presente para ' + student.name"
                (click)="onMarkClick(student.id, 'present')"
              >
                <i class="fa-solid fa-check" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        } @empty {
          @if (!students().length) {
            <article class="teacher-card">
              <p class="dropdown-empty">No hay alumnos cargados para este horario.</p>
            </article>
          }
        }
      </section>

      @if (pendingModalOpen()) {
        <div class="checkmate-dialog-overlay" (click)="pendingModalOpen.set(false)">
          <section
            class="checkmate-dialog checkmate-dialog--pending"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-students-title"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              class="checkmate-dialog__close"
              aria-label="Cerrar modal"
              (click)="pendingModalOpen.set(false)"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <h2 id="pending-students-title">Alumnos sin checar</h2>
            <p>Marca manualmente a los alumnos que no han registrado su tarjeta NFC.</p>

            <div class="teacher-pending-list">
              @for (student of pendingStudents(); track student.id) {
                <article class="teacher-pending-row">
                  <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
                  <div>
                    <strong>{{ student.name }}</strong>
                    <span>Mat: {{ student.enrollment }}</span>
                  </div>

                  <div class="teacher-mark-control" [class.is-disabled]="student.disabled || sessionClosed()">
                    <button
                      type="button"
                      class="teacher-mark-button teacher-mark-button--absent"
                      [class.is-active]="isSelected(student.id, 'absent')"
                      [disabled]="student.disabled || sessionClosed()"
                      [attr.aria-pressed]="isSelected(student.id, 'absent')"
                      [attr.aria-label]="'Marcar falta para ' + student.name"
                      (click)="onMarkClick(student.id, 'absent')"
                    >
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="teacher-mark-button teacher-mark-button--late"
                      [class.is-active]="isSelected(student.id, 'late')"
                      [disabled]="student.disabled || sessionClosed()"
                      [attr.aria-pressed]="isSelected(student.id, 'late')"
                      [attr.aria-label]="'Marcar retardo para ' + student.name"
                      (click)="onMarkClick(student.id, 'late')"
                    >
                      <i class="fa-regular fa-clock" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="teacher-mark-button teacher-mark-button--present"
                      [class.is-active]="isSelected(student.id, 'present')"
                      [disabled]="student.disabled || sessionClosed()"
                      [attr.aria-pressed]="isSelected(student.id, 'present')"
                      [attr.aria-label]="'Marcar presente para ' + student.name"
                      (click)="onMarkClick(student.id, 'present')"
                    >
                      <i class="fa-solid fa-check" aria-hidden="true"></i>
                    </button>
                  </div>
                </article>
              } @empty {
                <p class="dropdown-empty">Todos los alumnos ya se registraron.</p>
              }
            </div>
          </section>
        </div>
      }

      @if (infoStudent(); as student) {
        <div class="checkmate-dialog-overlay" (click)="infoStudentId.set(null)">
          <section
            class="checkmate-dialog checkmate-dialog--info"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-info-title"
            (click)="$event.stopPropagation()"
          >
            <button
              type="button"
              class="checkmate-dialog__close"
              aria-label="Cerrar modal"
              (click)="infoStudentId.set(null)"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
            <h2 id="student-info-title">{{ student.name }}</h2>

            <dl class="teacher-student-info-list">
              <div>
                <dt>Matricula</dt>
                <dd>{{ student.enrollment }}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{{ statusLabel(student.status) }}</dd>
              </div>
              <div>
                <dt>Hora exacta de registro</dt>
                <dd>{{ student.registeredAt ? formatRegisteredAt(student.registeredAt) : 'Sin registrar' }}</dd>
              </div>
              <div>
                <dt>Metodo</dt>
                <dd>{{ methodLabel(student.method) }}</dd>
              </div>
              <div>
                <dt>NFC UID</dt>
                <dd>{{ student.nfcUid || 'Sin tarjeta asignada' }}</dd>
              </div>
            </dl>
          </section>
        </div>
      }
    </section>
  `,
})
export class TeacherTakeAttendanceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly opening = signal(false);
  protected readonly sessionOpen = signal(false);
  protected readonly sessionClosed = signal(false);
  protected readonly marks = signal<Record<string, AttendanceMark>>({});
  protected readonly students = signal<TeacherAttendanceStudentView[]>([]);
  protected readonly classItem = signal<TeacherClassView | null>(null);
  protected readonly recentlyUpdated = signal<Set<string>>(new Set());
  protected readonly checkedInIds = signal<Set<string>>(new Set());
  protected readonly pendingModalOpen = signal(false);
  protected readonly infoStudentId = signal<string | null>(null);
  protected readonly visibleStudents = computed(() =>
    this.students().filter((student) => this.checkedInIds().has(student.id)),
  );
  protected readonly pendingStudents = computed(() =>
    this.students().filter((student) => !this.checkedInIds().has(student.id)),
  );
  protected readonly infoStudent = computed(() =>
    this.students().find((student) => student.id === this.infoStudentId()) ?? null,
  );
  private sessionId = '';

  constructor() {
    const scheduleId = this.route.snapshot.paramMap.get('classId');

    forkJoin({
      classes: this.teacherApi.getTodayClasses(),
      state: this.teacherApi.getSessionState(scheduleId),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ classes, state }) => {
        this.classItem.set(
          classes.find(
            (classEntry) => classEntry.scheduleId === scheduleId || classEntry.id === scheduleId,
          ) ?? null,
        );
        this.students.set(state.students);
        this.sessionId = state.sessionId;
        this.sessionOpen.set(state.sessionOpen);
        this.marks.set(
          Object.fromEntries(state.students.map((student) => [student.id, student.status])) as Record<
            string,
            AttendanceMark
          >,
        );
        this.checkedInIds.set(
          new Set(state.students.filter((student) => student.checkedIn).map((student) => student.id)),
        );

        if (scheduleId) {
          this.connectStream(scheduleId);
        }
      });
  }

  protected newIncidentRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/incidents/new' : '/teacher/incidents/new';
  }

  protected presentCount(): number {
    return this.students().filter(
      (student) => !student.disabled && this.marks()[student.id] === 'present',
    ).length;
  }

  protected async onMarkClick(studentId: string, status: AttendanceMark): Promise<void> {
    const previousStatus = this.marks()[studentId];

    if (previousStatus === status) {
      return;
    }

    if (this.checkedInIds().has(studentId)) {
      const student = this.students().find((entry) => entry.id === studentId);
      const name = student?.name ?? 'el alumno';
      const copy = this.confirmChangeCopy(name, status);

      const confirmed = await this.dialogService.confirm(copy);

      if (!confirmed) {
        return;
      }
    }

    const previousStudent = this.students().find((entry) => entry.id === studentId) ?? null;
    const previousCheckedIn = this.checkedInIds().has(studentId);

    this.markStudent(studentId, status);
    this.persistMark(studentId, status, previousStatus, previousStudent, previousCheckedIn);
  }

  /**
   * Saves a manual mark to the backend right away — there's no "Guardar" button anymore, so this
   * is the only thing that makes a manual correction durable. The class session auto-closes on
   * schedule without ever looking at local browser state, so an un-persisted mark would get
   * silently overwritten as FALTA when that happens. If the save fails, roll the optimistic UI
   * update back so the card honestly reflects "not saved" and the same button click can retry
   * (onMarkClick no-ops when the target status already matches the current one).
   */
  private persistMark(
    studentId: string,
    status: AttendanceMark,
    previousStatus: AttendanceMark,
    previousStudent: TeacherAttendanceStudentView | null,
    previousCheckedIn: boolean,
  ): void {
    const scheduleId = this.classItem()?.scheduleId;

    if (!scheduleId) {
      return;
    }

    this.teacherApi
      .saveAttendance(scheduleId, { [studentId]: status }, this.sessionId || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sessionId) => {
          this.sessionId = sessionId;
          this.sessionOpen.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.revertLocalMark(studentId, previousStatus, previousStudent, previousCheckedIn);

          const student = this.students().find((entry) => entry.id === studentId);
          this.toastService.error(
            `No se pudo guardar a ${student?.name ?? 'el alumno'}`,
            apiErrorMessage(error, 'El cambio no se guardo. Intenta marcarlo de nuevo.'),
          );
        },
      });
  }

  private revertLocalMark(
    studentId: string,
    previousStatus: AttendanceMark,
    previousStudent: TeacherAttendanceStudentView | null,
    previousCheckedIn: boolean,
  ): void {
    this.marks.update((current) => ({ ...current, [studentId]: previousStatus }));

    if (previousStudent) {
      this.students.update((current) =>
        current.map((entry) => (entry.id === studentId ? previousStudent : entry)),
      );
    }

    this.checkedInIds.update((current) => {
      const next = new Set(current);

      if (previousCheckedIn) {
        next.add(studentId);
      } else {
        next.delete(studentId);
      }

      return next;
    });
  }

  private confirmChangeCopy(
    name: string,
    status: AttendanceMark,
  ): { title: string; message: string; confirmText: string; variant: 'warning' | 'success'; icon: string } {
    if (status === 'absent') {
      return {
        title: 'Marcar falta',
        message: `${name} ya esta registrado en la clase. ¿Seguro que quieres marcarlo como falta? Se quitara de la lista y volvera a "Alumnos sin checar".`,
        confirmText: 'Marcar falta',
        variant: 'warning',
        icon: 'fa-solid fa-triangle-exclamation',
      };
    }

    if (status === 'late') {
      return {
        title: 'Cambiar a retardo',
        message: `¿Seguro que quieres cambiar el estado de ${name} a retardo?`,
        confirmText: 'Cambiar a retardo',
        variant: 'warning',
        icon: 'fa-regular fa-clock',
      };
    }

    return {
      title: 'Cambiar a asistencia',
      message: `¿Seguro que quieres cambiar el estado de ${name} a asistencia a tiempo?`,
      confirmText: 'Cambiar a asistencia',
      variant: 'success',
      icon: 'fa-solid fa-check',
    };
  }

  protected markStudent(studentId: string, status: AttendanceMark): void {
    this.marks.update((current) => ({ ...current, [studentId]: status }));
    this.students.update((current) =>
      current.map((entry) =>
        entry.id === studentId
          ? status === 'absent'
            ? { ...entry, registeredAt: '', method: '' }
            : { ...entry, registeredAt: new Date().toISOString(), method: 'MANUAL' }
          : entry,
      ),
    );
    this.checkedInIds.update((current) => {
      const next = new Set(current);

      if (status === 'absent') {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }

      return next;
    });
  }

  protected isSelected(studentId: string, status: AttendanceMark): boolean {
    return this.marks()[studentId] === status;
  }

  protected async openNow(): Promise<void> {
    const scheduleId = this.classItem()?.scheduleId;

    if (!scheduleId || this.opening()) {
      return;
    }

    this.opening.set(true);
    this.teacherApi
      .saveAttendance(scheduleId, {})
      .pipe(
        finalize(() => this.opening.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (sessionId) => {
          this.sessionId = sessionId;
          this.sessionOpen.set(true);
          this.toastService.success('Clase abierta', 'Ya puedes registrar asistencia.');
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo abrir la clase',
            apiErrorMessage(error, 'Intenta nuevamente en unos segundos.'),
          );
        },
      });
  }

  private connectStream(scheduleId: string): void {
    this.teacherApi
      .streamSessionState(scheduleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const data = toRecord(event.data);

        if (event.event === 'session') {
          this.sessionOpen.set(true);
          this.sessionId = readString(data, 'id') || this.sessionId;
          return;
        }

        if (event.event === 'attendance') {
          this.applyLiveAttendance(
            readNumber(data, 'student_id', 0),
            readString(data, 'status'),
            readString(data, 'registered_at'),
            readString(data, 'method'),
          );
          return;
        }

        if (event.event === 'closed') {
          this.sessionOpen.set(false);
          this.sessionClosed.set(true);
        }
      });
  }

  private applyLiveAttendance(studentId: number, apiStatus: string, registeredAt: string, method: string): void {
    const student = this.students().find((entry) => entry.id === String(studentId));

    if (!student) {
      return;
    }

    const mark = this.toAttendanceMark(apiStatus);
    this.marks.update((current) => ({ ...current, [student.id]: mark }));
    this.checkedInIds.update((current) => new Set(current).add(student.id));
    this.students.update((current) =>
      current.map((entry) => (entry.id === student.id ? { ...entry, registeredAt, method } : entry)),
    );

    this.recentlyUpdated.update((current) => new Set(current).add(student.id));
    setTimeout(() => {
      this.recentlyUpdated.update((current) => {
        const next = new Set(current);
        next.delete(student.id);
        return next;
      });
    }, 4000);

    this.toastService.success('Alumno registrado', `${student.name} se registro en la clase.`);
  }

  private toAttendanceMark(status: string): AttendanceMark {
    if (status === 'PRESENTE') {
      return 'present';
    }

    if (status === 'RETARDO') {
      return 'late';
    }

    if (status === 'JUSTIFICADA') {
      return 'justified';
    }

    return 'absent';
  }

  protected statusLabel(status: AttendanceMark): string {
    if (status === 'present') {
      return 'Presente';
    }

    if (status === 'late') {
      return 'Retardo';
    }

    if (status === 'justified') {
      return 'Justificado';
    }

    return 'Falta';
  }

  protected methodLabel(method: string): string {
    if (method === 'NFC') {
      return 'Tarjeta NFC';
    }

    if (method === 'MANUAL') {
      return 'Registro manual del profesor';
    }

    if (method === 'SISTEMA') {
      return 'Sistema';
    }

    return 'Sin registrar';
  }

  protected formatRegisteredAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }
}
