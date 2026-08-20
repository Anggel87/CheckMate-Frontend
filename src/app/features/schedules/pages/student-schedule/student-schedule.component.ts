import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  StudentClassView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

const DAY_KEYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const ACCENT_COUNT = 6;

@Component({
  selector: 'app-student-schedule',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header">
        <div>
          <h1>Mi Horario</h1>
          <p>Consulta tus clases por dia: materia, profesor y salon.</p>
        </div>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando horario..." [showLabel]="true" />
      } @else {
        <article class="student-card student-horario-card">
          <div class="student-day-picker" role="tablist" aria-label="Selecciona un dia">
            @for (day of dayLabels; track day; let i = $index) {
              <button
                type="button"
                role="tab"
                [class.is-active]="selectedDay() === i"
                [class.is-today]="todayIndex === i"
                [attr.aria-selected]="selectedDay() === i"
                (click)="selectedDay.set(i)"
              >
                {{ day }}
                @if (todayIndex === i) {
                  <small>HOY</small>
                }
              </button>
            }
          </div>

          <div class="student-day-summary">
            <h2>{{ fullDayLabel() }}</h2>
            <span>{{ classesForSelectedDay().length }} clase(s)</span>
          </div>

          @if (classesForSelectedDay().length > 0) {
            <section class="student-class-timeline" aria-label="Clases del dia seleccionado">
              @for (classItem of classesForSelectedDay(); track classItem.scheduleId; let i = $index) {
                <article class="student-class-card" [class]="'student-class-card student-class-card--c' + accentFor(classItem.subject, i)">
                  <div class="student-class-card__time">
                    <strong>{{ classItem.start }}</strong>
                    <span>{{ classItem.end }}</span>
                  </div>

                  <div class="student-class-card__body">
                    <div class="student-class-card__top">
                      <span class="student-class-card__icon" aria-hidden="true">
                        <i class="fa-solid fa-book"></i>
                      </span>
                      <h2>{{ classItem.subject }}</h2>
                    </div>

                    <div class="student-class-card__chips">
                      @if (classItem.teacherId) {
                        <a [routerLink]="['/student/teachers', classItem.teacherId]">
                          <i class="fa-regular fa-user" aria-hidden="true"></i> {{ classItem.teacher }}
                        </a>
                      } @else {
                        <span><i class="fa-regular fa-user" aria-hidden="true"></i> {{ classItem.teacher }}</span>
                      }
                      <span><i class="fa-regular fa-building" aria-hidden="true"></i> {{ classItem.classroom }}</span>
                    </div>
                  </div>
                </article>
              }
            </section>
          } @else {
            <div class="student-schedule-empty">
              <i class="fa-regular fa-face-smile-beam" aria-hidden="true"></i>
              <strong>Sin clases este dia</strong>
              <p>Aprovecha para descansar o ponerte al corriente.</p>
            </div>
          }
        </article>
      }
    </section>
  `,
})
export class StudentScheduleComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);
  private readonly subjectAccents = new Map<string, number>();

  protected readonly dayLabels = DAY_LABELS;
  protected readonly todayIndex = new Date().getDay();
  protected readonly loading = signal(true);
  protected readonly week = signal<Record<string, StudentClassView[]>>({});
  protected readonly selectedDay = signal(this.todayIndex);

  protected readonly classesForSelectedDay = computed(
    () => this.week()[DAY_KEYS[this.selectedDay()]] ?? [],
  );

  constructor() {
    this.studentApi
      .getWeekSchedule()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((week) => this.week.set(week));
  }

  protected fullDayLabel(): string {
    const labels = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return labels[this.selectedDay()];
  }

  /**
   * Cada materia conserva siempre el mismo color de acento sin importar el
   * dia, asignado la primera vez que aparece (no por indice de fila, que
   * cambiaria de un dia a otro).
   */
  protected accentFor(subject: string, fallbackIndex: number): number {
    if (!this.subjectAccents.has(subject)) {
      this.subjectAccents.set(subject, this.subjectAccents.size % ACCENT_COUNT);
    }

    return this.subjectAccents.get(subject) ?? fallbackIndex % ACCENT_COUNT;
  }
}
