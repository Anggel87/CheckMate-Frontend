import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEACHER_TODAY_CLASSES } from '../../../../core/mocks/teacher.mock';

@Component({
  selector: 'app-teacher-today-subjects',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page teacher-today-page">
      <header class="teacher-page__header">
        <div>
          <h1>Tus materias de hoy</h1>
          <p>Jueves, 24 de Octubre</p>
        </div>
        <span class="teacher-inline-pill">
          <i class="fa-regular fa-clock" aria-hidden="true"></i>
          Proxima clase en 45 min
        </span>
      </header>

      <div class="teacher-page__split teacher-page__split--summary">
        <section class="teacher-schedule-list" aria-label="Materias programadas">
          @for (classItem of classes; track classItem.id) {
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
                  [routerLink]="['/teacher/attendance/take', classItem.id]"
                >
                  <span>Entrar a clase</span>
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </a>
              } @else if (classItem.status === 'next') {
                <button type="button" class="btn-checkmate btn-checkmate-secondary">
                  <span>Preparar</span>
                  <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                </button>
              } @else {
                <button
                  type="button"
                  class="icon-button"
                  [attr.aria-label]="'Ver ' + classItem.subject"
                >
                  <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </button>
              }
            </article>
          }
        </section>

        <aside class="teacher-card teacher-day-summary" aria-label="Resumen del dia">
          <h2>Resumen del dia</h2>
          <div class="teacher-summary-line">
            <span><i class="fa-regular fa-clipboard" aria-hidden="true"></i> Total clases</span>
            <strong>3</strong>
          </div>
          <div class="teacher-summary-line">
            <span><i class="fa-solid fa-users" aria-hidden="true"></i> Alumnos esperados</span>
            <strong>85</strong>
          </div>
          <div class="teacher-progress-block">
            <span>Progreso del dia</span>
            <div class="teacher-progress" aria-hidden="true">
              <span style="width: 32%"></span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
})
export class TeacherTodaySubjectsComponent {
  protected readonly classes = TEACHER_TODAY_CLASSES;
}
