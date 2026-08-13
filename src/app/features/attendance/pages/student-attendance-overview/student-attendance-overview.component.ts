import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { downloadPdfReport } from '../../../../shared/utils/pdf-report.util';
import {
  StudentAttendanceOverviewView,
  StudentMetricView,
  StudentPortalApiService,
  StudentAttendanceRecordView,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-attendance-overview',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mis Asistencias</h1>
          <p>Consulta tus asistencias registradas.</p>
        </div>

        <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="downloadReport()">
          <i class="fa-solid fa-download" aria-hidden="true"></i>
          <span>Descargar Reporte</span>
        </button>
      </header>

      @if (loading()) {
        <app-loading-spinner label="Cargando asistencias..." [showLabel]="true" />
      } @else {
        <section
          class="student-stat-grid student-stat-grid--four"
          aria-label="Resumen de asistencias"
        >
          @for (metric of metrics(); track metric.label) {
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
                <button
                  type="button"
                  class="student-icon-button"
                  aria-label="Mes anterior"
                  (click)="goToPreviousMonth()"
                >
                  <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <strong>{{ monthLabel() }}</strong>
                <button
                  type="button"
                  class="student-icon-button"
                  aria-label="Mes siguiente"
                  (click)="goToNextMonth()"
                >
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
                @if (!isCurrentMonth()) {
                  <button
                    type="button"
                    class="btn-checkmate btn-checkmate-secondary student-calendar-today"
                    (click)="goToCurrentMonth()"
                  >
                    Hoy
                  </button>
                }
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
              [attr.aria-label]="'Calendario de asistencia ' + monthLabel()"
            >
              @for (dayName of dayNames; track dayName) {
                <strong role="columnheader">{{ dayName }}</strong>
              }

              @for (week of calendarWeeks(); track $index) {
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
              @for (record of recentRecords(); track record.id) {
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
              } @empty {
                <p class="dropdown-empty">Sin registros recientes.</p>
              }
            </div>
          </article>
        </section>
      }
    </section>
  `,
})
export class StudentAttendanceOverviewComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  protected readonly loading = signal(true);
  protected readonly metrics = signal<StudentMetricView[]>([]);
  protected readonly records = signal<StudentAttendanceRecordView[]>([]);
  protected readonly recentRecords = signal<StudentAttendanceRecordView[]>([]);

  private readonly today = new Date();
  protected readonly viewYear = signal(this.today.getFullYear());
  protected readonly viewMonth = signal(this.today.getMonth());

  protected readonly calendarWeeks = computed(() =>
    this.studentApi.buildCalendarWeeks(this.records(), this.viewYear(), this.viewMonth()),
  );
  protected readonly monthLabel = computed(() =>
    this.studentApi.monthLabelFor(this.viewYear(), this.viewMonth()),
  );
  protected readonly isCurrentMonth = computed(
    () => this.viewYear() === this.today.getFullYear() && this.viewMonth() === this.today.getMonth(),
  );

  constructor() {
    this.studentApi
      .getAttendanceOverview()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((overview: StudentAttendanceOverviewView) => {
        this.metrics.set(overview.metrics);
        this.records.set(overview.records);
        this.recentRecords.set(overview.recentRecords);
      });
  }

  protected goToPreviousMonth(): void {
    this.shiftMonth(-1);
  }

  protected goToNextMonth(): void {
    this.shiftMonth(1);
  }

  protected goToCurrentMonth(): void {
    this.viewYear.set(this.today.getFullYear());
    this.viewMonth.set(this.today.getMonth());
  }

  private shiftMonth(delta: number): void {
    const date = new Date(this.viewYear(), this.viewMonth() + delta, 1);
    this.viewYear.set(date.getFullYear());
    this.viewMonth.set(date.getMonth());
  }

  protected downloadReport(): void {
    downloadPdfReport({
      title: 'Reporte de Asistencias',
      subtitle: this.monthLabel(),
      meta: this.metrics().map((metric) => ({ label: metric.label, value: metric.value })),
      tables: [
        {
          title: 'Historial de asistencias',
          columns: ['Fecha', 'Materia', 'Estado', 'Hora'],
          rows: this.records().map((record) => [record.date, record.subject, record.status, record.time]),
        },
      ],
      fileName: `reporte-asistencias-${this.viewYear()}-${this.viewMonth() + 1}.pdf`,
    });
  }
}
