import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  TeacherEmergencyStudentView,
  TeacherIncidentDetailView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';
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
          <p>{{ incident()?.title || 'Incidente activo' }}</p>
        </div>
      </header>

      <div class="teacher-emergency-layout">
        <section aria-label="Lista de alumnos">
          <div class="teacher-tabs">
            <button type="button" class="is-active">API real</button>
          </div>

          <div class="teacher-emergency-student-list">
            @for (student of students(); track student.id) {
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
            } @empty {
              <p class="dropdown-empty">No hay alumnos asociados al incidente activo.</p>
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

          <button
            type="button"
            class="btn-checkmate btn-checkmate-success teacher-emergency-save"
            [disabled]="saving()"
            (click)="save()"
          >
            <i class="fa-regular fa-floppy-disk" aria-hidden="true"></i>
            Guardar
          </button>
        </aside>
      </div>

      <p class="teacher-empty-note" aria-live="polite">
        Verificados: {{ checkedCount() }} de {{ students().length }}
      </p>
    </section>
  `,
})
export class TeacherEmergencyListComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly marks = signal<Record<string, EmergencyMark>>({});
  protected readonly saving = signal(false);
  protected readonly checkedCount = computed(
    () => Object.values(this.marks()).filter((mark) => mark !== '').length,
  );
  protected readonly incident = signal<TeacherIncidentDetailView | null>(null);
  protected readonly students = signal<TeacherEmergencyStudentView[]>([]);

  constructor() {
    this.teacherApi
      .getEmergencyIncident()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((incident) => {
        this.incident.set(incident);
        this.students.set(incident.students);
        this.marks.set(
          Object.fromEntries(
            incident.students.map((student) => [
              student.id,
              student.status === 'PRESENTE' ? 'present' : student.status === 'AUSENTE' ? 'absent' : '',
            ]),
          ) as Record<string, EmergencyMark>,
        );
      });
  }

  protected mark(studentId: string, value: EmergencyMark): void {
    this.marks.update((current) => ({ ...current, [studentId]: value }));
  }

  protected async save(): Promise<void> {
    if (!this.incident()?.id) {
      this.toastService.error('Sin incidente activo', 'No hay un incidente activo para actualizar.');
      return;
    }

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

    this.saving.set(true);
    this.teacherApi
      .updateIncidentStudents(this.incident()!.id, this.marks())
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Lista guardada', 'La verificacion fue enviada a la API.');
        },
        error: () => {
          this.toastService.error('No se pudo guardar', 'La API rechazo la verificacion.');
        },
      });
  }
}
