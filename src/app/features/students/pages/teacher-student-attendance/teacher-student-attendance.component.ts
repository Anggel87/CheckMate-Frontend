import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TEACHER_STUDENT_ATTENDANCE_HISTORY,
  TEACHER_STUDENT_PROFILE,
} from '../../../../core/mocks/teacher.mock';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-student-attendance',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
        <a routerLink="/teacher/groups">Tus grupos</a>
        <span>/</span>
        <a routerLink="/teacher/groups/1-a/students">3° A - Matutino</a>
        <span>/</span>
        <strong>Alejandro Garcia</strong>
      </nav>

      <article class="teacher-card teacher-student-summary-strip">
        <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.fullName" />
        <div>
          <h1>{{ student.fullName }}</h1>
          <p><i class="fa-regular fa-id-card"></i> ID: 2023045 <span>3° A - Matutino</span></p>
        </div>
        <div>
          <a class="btn-checkmate btn-checkmate-secondary" href="mailto:j.ramirez@checkmate.edu.mx">
            <i class="fa-regular fa-envelope" aria-hidden="true"></i>
            Contactar Tutor
          </a>
          <button type="button" class="btn-checkmate btn-checkmate-primary">
            <i class="fa-solid fa-plus" aria-hidden="true"></i>
            Nueva Justificacion
          </button>
        </div>
      </article>

      <section class="teacher-stats-grid">
        <article class="teacher-stat-card">
          <span>Total asistencias</span>
          <strong>142 <small>Este semestre</small></strong>
          <i class="fa-regular fa-circle-check is-success" aria-hidden="true"></i>
        </article>
        <article class="teacher-stat-card">
          <span>Inasistencias</span>
          <strong>5 <small>Sin justificar: 2</small></strong>
          <i class="fa-regular fa-circle-xmark is-danger" aria-hidden="true"></i>
        </article>
        <article class="teacher-stat-card">
          <span>Retardos</span>
          <strong>3 <small>Acumulados</small></strong>
          <i class="fa-regular fa-clock is-warning" aria-hidden="true"></i>
        </article>
      </section>

      <section class="teacher-table-card" aria-label="Historial de asistencias">
        <header class="teacher-table-card__header">
          <h2>Historial de Asistencias</h2>
          <div class="teacher-filter-actions">
            <button type="button" class="teacher-filter-button">
              Todas las fechas <i class="fa-solid fa-chevron-down"></i>
            </button>
            <button type="button" class="teacher-filter-button">
              Todas las materias <i class="fa-solid fa-chevron-down"></i>
            </button>
            <button type="button" class="teacher-filter-button">
              Todos los estados <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </header>

        <div class="teacher-table teacher-history-table">
          <div class="teacher-table__row teacher-table__row--header">
            <span>Fecha</span>
            <span>Materia</span>
            <span>Hora</span>
            <span>Estado</span>
            <span>Accion</span>
          </div>
          @for (record of records; track record.id) {
            <div class="teacher-table__row">
              <span>{{ record.date }}</span>
              <span>{{ record.subject }}</span>
              <span>{{ record.time }}</span>
              <app-status-badge [label]="record.status" [tone]="record.statusTone" />
              <button
                type="button"
                class="icon-button"
                [attr.aria-label]="'Ver asistencia ' + record.date"
              >
                <i class="fa-regular fa-eye" aria-hidden="true"></i>
              </button>
            </div>
          }
        </div>

        <footer class="teacher-table-footer">
          <span>Mostrando 1 a 5 de 142 asistencias</span>
          <div>
            <button type="button" class="icon-button" aria-label="Pagina anterior">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" class="icon-button" aria-label="Pagina siguiente">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </footer>
      </section>
    </section>
  `,
})
export class TeacherStudentAttendanceComponent {
  protected readonly student = TEACHER_STUDENT_PROFILE;
  protected readonly records = TEACHER_STUDENT_ATTENDANCE_HISTORY;
}
