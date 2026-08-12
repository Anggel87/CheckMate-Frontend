import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AttendanceMark,
  TeacherAttendanceStudentView,
  TeacherClassView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';
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
      </header>

      <section class="teacher-attendance-toolbar" aria-label="Acciones de pase de lista">
        <div>
          <button
            type="button"
            class="btn-checkmate btn-checkmate-secondary"
            (click)="markAll('present')"
          >
            <i class="fa-regular fa-square-check" aria-hidden="true"></i>
            Marcar Todos
          </button>
          <button
            type="button"
            class="btn-checkmate btn-checkmate-secondary"
            (click)="markAll('absent')"
          >
            <i class="fa-solid fa-align-left" aria-hidden="true"></i>
            Desmarcar
          </button>
        </div>

        <div>
          <a class="btn-checkmate btn-checkmate-warning" routerLink="/teacher/incidents/new">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            Nuevo Incidente
          </a>
          <button type="button" class="btn-checkmate btn-checkmate-success" [disabled]="saving()" (click)="save()">
            <i class="fa-regular fa-floppy-disk" aria-hidden="true"></i>
            Guardar
          </button>
        </div>
      </section>

      <section class="teacher-attendance-grid" aria-label="Alumnos">
        @for (student of students(); track student.id) {
          <article
            class="teacher-attendance-card"
            [class.is-selected]="isSelected(student.id, 'present')"
          >
            <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
            <h2>{{ student.name }}</h2>
            <p>Mat: {{ student.enrollment }}</p>

            @if (student.disabled) {
              <span class="teacher-attendance-card__justified">Justificado</span>
            }

            <div class="teacher-mark-control" [class.is-disabled]="student.disabled">
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--absent"
                [class.is-active]="isSelected(student.id, 'absent')"
                [disabled]="student.disabled"
                [attr.aria-pressed]="isSelected(student.id, 'absent')"
                [attr.aria-label]="'Marcar falta para ' + student.name"
                (click)="markStudent(student.id, 'absent')"
              >
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--late"
                [class.is-active]="isSelected(student.id, 'late')"
                [disabled]="student.disabled"
                [attr.aria-pressed]="isSelected(student.id, 'late')"
                [attr.aria-label]="'Marcar retardo para ' + student.name"
                (click)="markStudent(student.id, 'late')"
              >
                <i class="fa-regular fa-clock" aria-hidden="true"></i>
              </button>
              <button
                type="button"
                class="teacher-mark-button teacher-mark-button--present"
                [class.is-active]="isSelected(student.id, 'present')"
                [disabled]="student.disabled"
                [attr.aria-pressed]="isSelected(student.id, 'present')"
                [attr.aria-label]="'Marcar presente para ' + student.name"
                (click)="markStudent(student.id, 'present')"
              >
                <i class="fa-solid fa-check" aria-hidden="true"></i>
              </button>
            </div>
          </article>
        } @empty {
          <article class="teacher-card">
            <p class="dropdown-empty">No hay alumnos cargados para este horario.</p>
          </article>
        }
      </section>
    </section>
  `,
})
export class TeacherTakeAttendanceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly saving = signal(false);
  protected readonly marks = signal<Record<string, AttendanceMark>>({});
  protected readonly students = signal<TeacherAttendanceStudentView[]>([]);
  protected readonly classItem = signal<TeacherClassView | null>(null);

  constructor() {
    this.teacherApi
      .getAttendanceContext(this.route.snapshot.paramMap.get('classId'))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((context) => {
        this.classItem.set(context.classItem);
        this.students.set(context.students);
        this.marks.set(
          Object.fromEntries(context.students.map((student) => [student.id, student.status])) as Record<
            string,
            AttendanceMark
          >,
        );
      });
  }

  protected presentCount(): number {
    return this.students().filter(
      (student) => !student.disabled && this.marks()[student.id] === 'present',
    ).length;
  }

  protected markAll(status: AttendanceMark): void {
    this.marks.update((current) => {
      const next = { ...current };
      this.students().forEach((student) => {
        if (!student.disabled) {
          next[student.id] = status;
        }
      });
      return next;
    });
  }

  protected markStudent(studentId: string, status: AttendanceMark): void {
    this.marks.update((current) => ({ ...current, [studentId]: status }));
  }

  protected isSelected(studentId: string, status: AttendanceMark): boolean {
    return this.marks()[studentId] === status;
  }

  protected async save(): Promise<void> {
    const scheduleId = this.classItem()?.scheduleId;

    if (!scheduleId) {
      this.toastService.error('Horario no encontrado', 'Abre el pase de lista desde una clase real.');
      return;
    }

    const confirmed = await this.dialogService.confirm({
      title: 'Guardar asistencia',
      message: 'Se guardara la asistencia de todo el grupo.',
      confirmText: 'Guardar',
      variant: 'success',
      icon: 'fa-regular fa-floppy-disk',
    });

    if (!confirmed) {
      return;
    }

    this.saving.set(true);
    this.teacherApi
      .saveAttendance(scheduleId, this.marks(), this.classItem()?.sessionId)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Asistencia guardada', 'La lista fue guardada correctamente.');
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo guardar la asistencia',
            apiErrorMessage(error, 'No se pudo abrir o actualizar la clase. Intenta nuevamente.'),
          );
        },
      });
  }
}
