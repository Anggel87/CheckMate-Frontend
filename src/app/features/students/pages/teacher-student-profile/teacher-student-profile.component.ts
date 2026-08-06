import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TEACHER_STUDENT_PROFILE } from '../../../../core/mocks/teacher.mock';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-student-profile',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page teacher-student-profile-page">
      <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
        <a routerLink="/teacher/dashboard">Dashboard</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <a routerLink="/teacher/groups/1-a/students">Alumnos</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Perfil del Alumno</strong>
      </nav>

      <article class="teacher-card teacher-student-hero">
        <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.name" />
        <div>
          <h1>{{ student.name }}</h1>
          <div class="badge-row">
            <app-status-badge label="Grupo 1-A" tone="danger" />
            <app-status-badge label="Departamento TICS" tone="neutral" />
          </div>
          <dl class="teacher-student-hero__stats">
            <div>
              <dt>Asistencia</dt>
              <dd>{{ student.attendance }}%</dd>
            </div>
            <div>
              <dt>Justificantes</dt>
              <dd>{{ student.justifications }}</dd>
            </div>
          </dl>
        </div>
        <a class="btn-checkmate btn-checkmate-primary" href="mailto:j.ramirez@checkmate.edu.mx">
          <i class="fa-regular fa-envelope" aria-hidden="true"></i>
          Contactar
        </a>
      </article>

      <nav class="teacher-profile-tabs" aria-label="Secciones del alumno">
        <a class="is-active" routerLink="/teacher/students/juan-ramirez">Asistencias</a>
        <a routerLink="/teacher/students/juan-ramirez/justifications">Justificantes</a>
        <button type="button">Calificaciones</button>
      </nav>

      <div class="teacher-profile-layout">
        <div class="teacher-profile-main">
          <section class="teacher-card teacher-attendance-calendar-small">
            <header>
              <h2>Historial de Asistencia - Octubre</h2>
              <div>
                <button type="button" class="icon-button" aria-label="Mes anterior">
                  <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
                </button>
                <button type="button" class="icon-button" aria-label="Mes siguiente">
                  <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                </button>
              </div>
            </header>
            <div class="teacher-mini-calendar" aria-label="Calendario de asistencia">
              @for (day of calendarDays; track day.number) {
                <span [class]="day.className">{{ day.number }}</span>
              }
            </div>
            <footer>
              <span><i class="fa-solid fa-circle"></i> Presente</span>
              <span><i class="fa-solid fa-circle is-red"></i> Falta</span>
              <span><i class="fa-solid fa-circle is-muted"></i> Justificado</span>
            </footer>
          </section>

          <section class="teacher-card teacher-activity-card">
            <header>
              <h2>Actividad Reciente</h2>
              <a routerLink="/teacher/students/juan-ramirez/attendance">Ver todo</a>
            </header>
            <div class="teacher-activity-list">
              <article>
                <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
                <div>
                  <strong>Asistencia Confirmada</strong
                  ><span>Sistemas Programables - 08:30 AM</span>
                </div>
                <time>Hoy</time>
              </article>
              <article>
                <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                <div>
                  <strong>Justificante Entregado</strong><span>Archivo: med_record_002.pdf</span>
                </div>
                <time>Ayer</time>
              </article>
              <article class="is-danger">
                <i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>
                <div>
                  <strong>Inasistencia Registrada</strong
                  ><span>Matematicas Avanzadas - 10:00 AM</span>
                </div>
                <time>12 Oct</time>
              </article>
            </div>
          </section>
        </div>

        <aside class="teacher-side-stack">
          <section class="teacher-card teacher-student-details-card">
            <h2><i class="fa-regular fa-user" aria-hidden="true"></i> Detalles del Alumno</h2>
            <dl>
              <div>
                <dt>Matricula</dt>
                <dd>{{ student.enrollment }}</dd>
              </div>
              <div>
                <dt>Correo Institucional</dt>
                <dd>{{ student.email }}</dd>
              </div>
              <div>
                <dt>Tutor Asignado</dt>
                <dd>{{ student.tutor }}</dd>
              </div>
            </dl>
          </section>

          <section class="teacher-trend-card">
            <span>Tendencia mensual</span>
            <strong>+2.4% <small>vs mes anterior</small></strong>
            <div aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
          </section>

          <section class="teacher-emergency-contact">
            <h2>
              <i class="fa-solid fa-star-of-life" aria-hidden="true"></i> Contacto de Emergencia
            </h2>
            <p>{{ student.emergencyContact }}</p>
            <strong>{{ student.emergencyPhone }}</strong>
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TeacherStudentProfileComponent {
  protected readonly student = TEACHER_STUDENT_PROFILE;
  protected readonly calendarDays = [
    { number: '1', className: 'is-present' },
    { number: '2', className: 'is-present' },
    { number: '3', className: 'is-absent' },
    { number: '4', className: 'is-present' },
    { number: '5', className: 'is-present' },
    { number: '6', className: '' },
    { number: '7', className: '' },
    { number: '8', className: 'is-present' },
    { number: '9', className: 'is-present' },
    { number: '10', className: 'is-present' },
    { number: '11', className: 'is-absent' },
    { number: '12', className: 'is-present' },
    { number: '13', className: '' },
    { number: '14', className: '' },
  ];
}
