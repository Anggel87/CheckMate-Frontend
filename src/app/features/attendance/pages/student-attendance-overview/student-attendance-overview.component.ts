import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  STUDENT_ATTENDANCE_SUMMARY,
  STUDENT_CALENDAR_WEEKS,
  STUDENT_RECENT_ATTENDANCE,
} from '../../../../core/mocks/student.mock';

@Component({
  selector: 'app-student-attendance-overview',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mis Asistencias</h1>
          <p>Ciclo Escolar 2023-2024 • Semestre 1</p>
        </div>

        <button type="button" class="btn-checkmate btn-checkmate-primary">
          <i class="fa-solid fa-download" aria-hidden="true"></i>
          <span>Descargar Reporte</span>
        </button>
      </header>

      <section
        class="student-stat-grid student-stat-grid--four"
        aria-label="Resumen de asistencias"
      >
        @for (metric of metrics; track metric.label) {
          <article
            class="student-card student-metric-card"
            [class]="'student-card student-metric-card student-metric-card--' + metric.tone"
          >
            <div>
              <span class="student-metric-card__label">
                <i [class]="metric.icon" aria-hidden="true"></i>
                {{ metric.label }}
              </span>
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.detail }}</span>
            </div>
          </article>
        }
      </section>

      <section class="student-attendance-layout">
        <article class="student-card student-calendar-card">
          <header>
            <h2>Calendario de Asistencia</h2>
            <div class="student-calendar-nav" aria-label="Cambiar mes">
              <button type="button" class="student-icon-button" aria-label="Mes anterior">
                <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
              <strong>Octubre 2023</strong>
              <button type="button" class="student-icon-button" aria-label="Mes siguiente">
                <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
          </header>

          <div class="student-calendar-legend" aria-label="Leyenda de estados">
            <span><i class="student-dot student-dot--present"></i> Presente</span>
            <span><i class="student-dot student-dot--late"></i> Retardo</span>
            <span><i class="student-dot student-dot--absent"></i> Falta</span>
            <span><i class="student-dot student-dot--justified"></i> Justificado</span>
          </div>

          <div
            class="student-calendar-grid"
            role="grid"
            aria-label="Calendario de asistencia Octubre 2023"
          >
            @for (dayName of dayNames; track dayName) {
              <strong role="columnheader">{{ dayName }}</strong>
            }

            @for (week of calendarWeeks; track $index) {
              @for (day of week; track day.day + '-' + $index) {
                <span
                  role="gridcell"
                  [class]="
                    'student-calendar-day' +
                    (day.muted ? ' is-muted' : '') +
                    (day.selected ? ' is-selected' : '') +
                    (day.tone ? ' student-calendar-day--' + day.tone : '')
                  "
                >
                  {{ day.day }}
                </span>
              }
            }
          </div>
        </article>

        <article class="student-card student-recent-card">
          <header>
            <h2>Historial Reciente</h2>
            <a routerLink="/student/attendance/history">Ver todo</a>
          </header>

          <div class="student-recent-list">
            @for (record of recentRecords; track record.id) {
              <a
                class="student-recent-item"
                [routerLink]="['/student/attendance/detail', record.id]"
              >
                <span
                  class="student-icon-bubble"
                  [class]="'student-icon-bubble student-icon-bubble--' + record.statusTone"
                  aria-hidden="true"
                >
                  <i
                    [class]="
                      record.statusTone === 'present'
                        ? 'fa-solid fa-check'
                        : record.statusTone === 'late'
                          ? 'fa-regular fa-clock'
                          : record.statusTone === 'absent'
                            ? 'fa-solid fa-xmark'
                            : 'fa-regular fa-calendar-check'
                    "
                  ></i>
                </span>
                <span>
                  <strong>{{ record.subject }}</strong>
                  <small>{{ record.date }}</small>
                </span>
                <app-status-badge [label]="record.status" [tone]="record.statusTone" />
              </a>
            }
          </div>
        </article>
      </section>
    </section>
  `,
})
export class StudentAttendanceOverviewComponent {
  protected readonly dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  protected readonly metrics = STUDENT_ATTENDANCE_SUMMARY;
  protected readonly calendarWeeks = STUDENT_CALENDAR_WEEKS;
  protected readonly recentRecords = STUDENT_RECENT_ATTENDANCE;
}
