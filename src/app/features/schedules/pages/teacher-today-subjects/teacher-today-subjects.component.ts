import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import {
  TeacherClassView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

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
                    [routerLink]="['/teacher/attendance/take', classItem.scheduleId]"
                  >
                    <span>Entrar a clase</span>
                    <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                  </a>
                } @else if (classItem.status === 'next') {
                  <a
                    class="btn-checkmate btn-checkmate-secondary"
                    [routerLink]="['/teacher/attendance/take', classItem.scheduleId]"
                  >
                    <span>Preparar</span>
                    <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                  </a>
                } @else {
                  <a
                    class="icon-button"
                    [routerLink]="['/teacher/groups', classItem.groupId, 'students']"
                    [attr.aria-label]="'Ver ' + classItem.subject"
                  >
                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                  </a>
                }
              </article>
            } @empty {
              <article class="teacher-card">
                <p class="dropdown-empty">No hay clases programadas para hoy.</p>
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
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly classes = signal<TeacherClassView[]>([]);

  constructor() {
    this.teacherApi
      .getTodayClasses()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((classes) => {
        this.classes.set(classes);
      });
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
