import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  TeacherClassView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

const DAY_KEYS = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

interface NearestClassView {
  dayLabel: string;
  start: string;
  classroom: string;
  subject: string;
}

@Component({
  selector: 'app-teacher-today-subjects',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent],
  template: `
    <section class="teacher-page teacher-today-page">
      @if (loading()) {
        <app-loading-spinner label="Cargando materias de hoy..." [showLabel]="true" />
      } @else {
        <header class="teacher-page__header">
          <div>
            <h1>Tus materias de hoy</h1>
            <p>{{ todayLabel() }}</p>
          </div>
          @if (nextClass()) {
            <span class="teacher-inline-pill">
              <i class="fa-regular fa-clock" aria-hidden="true"></i>
              Proxima clase: {{ nextClass()?.subject }}
            </span>
          }
        </header>

        <div class="teacher-page__split teacher-page__split--summary">
          <section class="teacher-schedule-list" aria-label="Materias programadas">
            @for (classItem of classes(); track classItem.id) {
              <article
                class="teacher-schedule-row"
                [class.is-active]="classItem.status === 'active'"
                [class.is-done]="classItem.status === 'done'"
              >
                <div class="teacher-schedule-row__time">
                  <strong>{{ classItem.start }}</strong>
                  <span>{{ classItem.end }}</span>
                </div>

                <div class="teacher-schedule-row__content">
                  <div class="teacher-schedule-row__chips">
                    <span>{{ classItem.group }}</span>
                    <span>{{ classItem.classroom }}</span>
                    @if (classItem.countdown) {
                      <b>
                        <i class="fa-solid fa-circle" aria-hidden="true"></i>
                        {{ classItem.countdown }}
                      </b>
                    }
                  </div>
                  <h2>{{ classItem.subject }}</h2>
                </div>

                @if (classItem.status === 'active') {
                  <a
                    class="btn-checkmate btn-checkmate-primary"
                    [routerLink]="[attendanceTakeRoute(), classItem.scheduleId]"
                  >
                    <span>Entrar a clase</span>
                    <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </a>
                } @else if (classItem.status === 'next') {
                  <a
                    class="btn-checkmate btn-checkmate-secondary"
                    [routerLink]="[attendanceTakeRoute(), classItem.scheduleId]"
                  >
                    <span>Preparar</span>
                    <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                  </a>
                } @else {
                  <a
                    class="icon-button"
                    [routerLink]="viewGroupRoute(classItem)"
                    [attr.aria-label]="'Ver ' + classItem.subject"
                  >
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                  </a>
                }
                <a
                  class="icon-button"
                  [routerLink]="attendanceSettingRoute(classItem)"
                  [attr.aria-label]="'Configurar tolerancia de asistencia de ' + classItem.subject"
                >
                  <i class="fa-solid fa-gear" aria-hidden="true"></i>
                </a>
              </article>
            } @empty {
              <article class="teacher-card">
                <p class="dropdown-empty">No hay clases programadas para hoy.</p>
              </article>
            }

            @if (!hasUpcomingToday()) {
              <article class="teacher-card teacher-nearest-class">
                @if (nearestClass(); as nearest) {
                  <p>
                    <i class="fa-regular fa-calendar" aria-hidden="true"></i>
                    Tu proxima clase es el <strong>{{ nearest.dayLabel }}</strong>, a las
                    <strong>{{ nearest.start }}</strong> en <strong>{{ nearest.classroom }}</strong>
                    ({{ nearest.subject }}).
                  </p>
                } @else if (classes().length > 0) {
                  <p class="dropdown-empty">No tienes mas clases programadas esta semana.</p>
                }
              </article>
            }
          </section>

          <aside class="teacher-card teacher-day-summary" aria-label="Resumen del dia">
            <h2>Resumen del dia</h2>
            <div class="teacher-summary-line">
              <span><i class="fa-regular fa-clipboard" aria-hidden="true"></i> Total clases</span>
              <strong>{{ classes().length }}</strong>
            </div>
            <div class="teacher-summary-line">
              <span><i class="fa-solid fa-users" aria-hidden="true"></i> Sesiones abiertas</span>
              <strong>{{ openSessions() }}</strong>
            </div>
            <div class="teacher-progress-block">
              <span>Progreso del dia</span>
              <div class="teacher-progress" aria-hidden="true">
                <span [style.width.%]="progress()"></span>
              </div>
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class TeacherTodaySubjectsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly classes = signal<TeacherClassView[]>([]);
  protected readonly nearestClass = signal<NearestClassView | null>(null);

  constructor() {
    this.teacherApi
      .getTodayClasses()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((classes) => {
        this.classes.set(classes);

        const active = classes.find((classItem) => classItem.status === 'active');

        if (active) {
          void this.router.navigate([this.attendanceTakeRoute(), active.scheduleId]);
          return;
        }

        if (!classes.some((classItem) => classItem.status === 'next')) {
          this.loadNearestClass();
        }
      });
  }

  protected hasUpcomingToday(): boolean {
    return this.classes().some((classItem) => classItem.status === 'active' || classItem.status === 'next');
  }

  private loadNearestClass(): void {
    this.teacherApi
      .getWeekSchedule()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((week) => {
        const todayIndex = new Date().getDay();

        for (let offset = 1; offset <= 7; offset++) {
          const dayIndex = (todayIndex + offset) % 7;
          const dayClasses = week[DAY_KEYS[dayIndex]] ?? [];

          if (!dayClasses.length) {
            continue;
          }

          const earliest = [...dayClasses].sort((a, b) => a.start.localeCompare(b.start))[0];

          this.nearestClass.set({
            dayLabel: DAY_LABELS[dayIndex],
            start: earliest.start,
            classroom: earliest.classroom,
            subject: earliest.subject,
          });
          return;
        }

        this.nearestClass.set(null);
      });
  }

  protected attendanceTakeRoute(): string {
    return this.router.url.startsWith('/tutor') ? '/tutor/attendance/take' : '/teacher/attendance/take';
  }

  protected viewGroupRoute(classItem: TeacherClassView): unknown[] {
    return this.router.url.startsWith('/tutor')
      ? ['/tutor/students']
      : ['/teacher/groups', classItem.groupId, 'students'];
  }

  protected attendanceSettingRoute(classItem: TeacherClassView): unknown[] {
    const prefix = this.router.url.startsWith('/tutor') ? '/tutor' : '/teacher';
    return [prefix, 'schedule', classItem.scheduleId, 'attendance-setting'];
  }

  protected nextClass(): TeacherClassView | undefined {
    return this.classes().find((classItem) => classItem.status === 'active' || classItem.status === 'next');
  }

  protected openSessions(): number {
    return this.classes().filter((classItem) => classItem.status === 'active').length;
  }

  protected progress(): number {
    if (!this.classes().length) {
      return 0;
    }

    return Math.round(
      (this.classes().filter((classItem) => classItem.status === 'done').length / this.classes().length) * 100,
    );
  }

  protected todayLabel(): string {
    const label = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());

    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
