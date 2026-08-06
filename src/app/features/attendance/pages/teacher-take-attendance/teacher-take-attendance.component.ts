import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceMark, TEACHER_ATTENDANCE_STUDENTS } from '../../../../core/mocks/teacher.mock';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';

@Component({
  selector: 'app-teacher-take-attendance',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page teacher-attendance-page">
      <header class="teacher-attendance-header">
        <div>
          <h1>Pasar Lista: Redes</h1>
          <p>Grupo 3-B • 17:00 a 18:40 • Lunes</p>
        </div>

        <div class="teacher-attendance-stats" aria-label="Resumen de asistencia">
          <article class="teacher-mini-stat">
            <span>Total alumnos</span>
            <strong>{{ students.length }}</strong>
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
          <button type="button" class="btn-checkmate btn-checkmate-success" (click)="save()">
            <i class="fa-regular fa-floppy-disk" aria-hidden="true"></i>
            Guardar
          </button>
        </div>
      </section>

      <section class="teacher-attendance-grid" aria-label="Alumnos">
        @for (student of students; track student.id) {
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
        }
      </section>
    </section>
  `,
})
export class TeacherTakeAttendanceComponent {
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly students = TEACHER_ATTENDANCE_STUDENTS;
  protected readonly marks = signal<Record<string, AttendanceMark>>(
    Object.fromEntries(this.students.map((student) => [student.id, student.status])) as Record<
      string,
      AttendanceMark
    >,
  );
  protected readonly presentCount = computed(
    () =>
      this.students.filter((student) => !student.disabled && this.marks()[student.id] === 'present')
        .length,
  );

  protected markAll(status: AttendanceMark): void {
    this.marks.update((current) => {
      const next = { ...current };
      this.students.forEach((student) => {
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
    const confirmed = await this.dialogService.confirm({
      title: 'Guardar asistencia',
      message: 'Se registraran los estados seleccionados para el grupo 3-B.',
      confirmText: 'Guardar',
      variant: 'success',
      icon: 'fa-regular fa-floppy-disk',
    });

    if (!confirmed) {
      return;
    }

    this.toastService.success('Asistencia guardada', 'La lista fue actualizada correctamente.');
  }
}
