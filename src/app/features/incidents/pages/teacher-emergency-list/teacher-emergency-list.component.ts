import { Component, computed, inject, signal } from '@angular/core';
import { TEACHER_EMERGENCY_STUDENTS } from '../../../../core/mocks/teacher.mock';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';

type EmergencyMark = 'present' | 'absent' | '';

@Component({
  selector: 'app-teacher-emergency-list',
  standalone: true,
  template: `
    <section class="teacher-page teacher-emergency-list-page">
      <header class="teacher-page__header">
        <div>
          <h1>Lista de alumnos emergencia</h1>
          <p>Verify the status of all students in the current zone.</p>
        </div>
      </header>

      <div class="teacher-emergency-layout">
        <section aria-label="Lista de alumnos">
          <div class="teacher-tabs">
            <button type="button" class="is-active">TICS</button>
            <button type="button">Mecatronica</button>
          </div>
          <div class="teacher-group-tabs" aria-label="Grupos">
            <button type="button" class="is-active">1-A</button>
            <button type="button">1-B</button>
            <button type="button">2-A</button>
            <button type="button">2-B</button>
            <button type="button">5-A</button>
          </div>

          <div class="teacher-emergency-student-list">
            @for (student of students; track student.id) {
              <article
                class="teacher-emergency-student"
                [class.is-present]="marks()[student.id] === 'present'"
              >
                <span>{{ student.name[0] }}</span>
                <div>
                  <strong>{{ student.name }}</strong>
                  <small>ID: {{ student.enrollment }}</small>
                </div>

                @if (student.status) {
                  <b>{{ student.status }}</b>
                } @else {
                  <div class="teacher-emergency-mark">
                    <button
                      type="button"
                      [class.is-active]="marks()[student.id] === 'present'"
                      [attr.aria-pressed]="marks()[student.id] === 'present'"
                      [attr.aria-label]="'Marcar presente a ' + student.name"
                      (click)="mark(student.id, 'present')"
                    >
                      P
                    </button>
                    <button
                      type="button"
                      [class.is-active]="marks()[student.id] === 'absent'"
                      [attr.aria-pressed]="marks()[student.id] === 'absent'"
                      [attr.aria-label]="'Marcar ausente a ' + student.name"
                      (click)="mark(student.id, 'absent')"
                    >
                      A
                    </button>
                  </div>
                }
              </article>
            }
          </div>
        </section>

        <aside class="teacher-side-stack">
          <section class="teacher-card teacher-comment-card">
            <h2><i class="fa-regular fa-message" aria-hidden="true"></i> Comentarios</h2>
            <label class="sr-only" for="emergency-comments">Comentarios</label>
            <textarea
              id="emergency-comments"
              class="checkmate-textarea"
              placeholder="Escriba notas adicionales sobre la situacion o ausencias..."
            ></textarea>
          </section>

          <section class="teacher-card teacher-comment-card">
            <h2><i class="fa-solid fa-camera" aria-hidden="true"></i> Evidencia</h2>
            <label class="teacher-file-drop" for="emergency-evidence">
              <input id="emergency-evidence" type="file" accept=".png,.jpg,.jpeg" />
              <i class="fa-solid fa-cloud-arrow-up" aria-hidden="true"></i>
              <span>Click or drag files to upload</span>
              <small>PNG, JPG up to 10MB</small>
            </label>
          </section>

          <button
            type="button"
            class="btn-checkmate btn-checkmate-success teacher-emergency-save"
            (click)="save()"
          >
            <i class="fa-regular fa-floppy-disk" aria-hidden="true"></i>
            Guardar
          </button>
        </aside>
      </div>

      <p class="teacher-empty-note" aria-live="polite">
        Verificados: {{ checkedCount() }} de {{ students.length }}
      </p>
    </section>
  `,
})
export class TeacherEmergencyListComponent {
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly students = TEACHER_EMERGENCY_STUDENTS;
  protected readonly marks = signal<Record<string, EmergencyMark>>(
    Object.fromEntries(
      this.students.map((student) => [student.id, student.status === 'PRESENTE' ? 'present' : '']),
    ) as Record<string, EmergencyMark>,
  );
  protected readonly checkedCount = computed(
    () => Object.values(this.marks()).filter((mark) => mark !== '').length,
  );

  protected mark(studentId: string, value: EmergencyMark): void {
    this.marks.update((current) => ({ ...current, [studentId]: value }));
  }

  protected async save(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Guardar lista de emergencia',
      message: 'Se registrara el estado actual de los alumnos verificados.',
      confirmText: 'Guardar',
      variant: 'success',
      icon: 'fa-regular fa-floppy-disk',
    });

    if (!confirmed) {
      return;
    }

    this.toastService.success('Lista guardada', 'La verificacion de emergencia fue registrada.');
  }
}
