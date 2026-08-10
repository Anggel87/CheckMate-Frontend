import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import {
  StudentAbsenceGroupView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-select-absence',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/justifications">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver
      </a>

      <header class="student-page__header">
        <div>
          <h1>Seleccionar Faltas</h1>
          <p>
            Selecciona las inasistencias que deseas justificar. Puedes seleccionar multiples faltas
            si ocurrieron en el mismo dia.
          </p>
        </div>
      </header>

      <article class="student-card student-absence-card">
        <h2>
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          Faltas sin justificar
        </h2>

        <div class="student-absence-list">
          @for (group of absenceGroups; track group.date) {
            <section class="student-absence-group" [attr.aria-label]="'Faltas del ' + group.date">
              <header>
                <strong>{{ group.date }}</strong>
                <label class="student-inline-check">
                  <input
                    type="checkbox"
                    [checked]="isDaySelected(group)"
                    [indeterminate]="isDayPartial(group)"
                    (change)="toggleDay(group, $event)"
                  />
                  <span>Seleccionar dia</span>
                </label>
              </header>

              @for (absence of group.absences; track absence.id) {
                <label class="student-absence-row">
                  <input
                    type="checkbox"
                    [checked]="isSelected(absence.id)"
                    (change)="toggleAbsence(absence.id, $event)"
                  />
                  <span>
                    <strong>{{ absence.subject }}</strong>
                    <small>{{ absence.teacher }}</small>
                  </span>
                  <span class="student-time-pill">
                    <i class="fa-regular fa-clock" aria-hidden="true"></i>
                    {{ absence.time }}
                  </span>
                  <span class="student-absence-pill">Ausente</span>
                </label>
              }
            </section>
          }
        </div>

        <footer class="student-form-actions">
          <a class="btn-checkmate btn-checkmate-secondary" routerLink="/student/justifications"
            >Cancelar</a
          >
          <button
            type="button"
            class="btn-checkmate btn-checkmate-primary"
            [disabled]="selectedCount() === 0"
            (click)="continue()"
          >
            <span>Continuar con Justificante</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </footer>
      </article>
    </section>
  `,
})
export class SelectAbsenceComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly studentApi = inject(StudentPortalApiService);

  protected absenceGroups: StudentAbsenceGroupView[] = [];
  protected readonly selectedAbsenceIds = signal<readonly string[]>([]);
  protected readonly selectedCount = computed(() => this.selectedAbsenceIds().length);

  constructor() {
    this.studentApi
      .getJustifiableAbsences()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((groups) => {
        this.absenceGroups = groups;
      });
  }

  protected isSelected(absenceId: string): boolean {
    return this.selectedAbsenceIds().includes(absenceId);
  }

  protected isDaySelected(group: StudentAbsenceGroupView): boolean {
    return group.absences.every((absence) => this.isSelected(absence.id));
  }

  protected isDayPartial(group: StudentAbsenceGroupView): boolean {
    const selected = group.absences.filter((absence) => this.isSelected(absence.id)).length;
    return selected > 0 && selected < group.absences.length;
  }

  protected toggleAbsence(absenceId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.selectedAbsenceIds.update((current) =>
      checked ? [...current, absenceId] : current.filter((id) => id !== absenceId),
    );
  }

  protected toggleDay(group: StudentAbsenceGroupView, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const dayIds = group.absences.map((absence) => absence.id);

    this.selectedAbsenceIds.update((current) => {
      if (!checked) {
        return current.filter((id) => !dayIds.includes(id));
      }

      return Array.from(new Set([...current, ...dayIds]));
    });
  }

  protected continue(): void {
    if (this.selectedCount() === 0) {
      this.toastService.warning('Seleccion requerida', 'Elige al menos una falta para continuar.');
      return;
    }

    if (this.selectedCount() > 1) {
      this.toastService.info(
        'Justificacion individual',
        'La API actual registra una falta por justificante. Se usara la primera seleccionada.',
      );
    }

    const selected = this.absenceGroups
      .flatMap((group) => group.absences)
      .find((absence) => this.isSelected(absence.id));

    void this.router.navigate(['/student/justifications/new'], {
      queryParams: {
        subjectId: selected?.subjectId,
        attendanceId: selected?.attendanceId,
      },
    });
  }
}
