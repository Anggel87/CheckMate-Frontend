import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="teacher-page tutor-dashboard-page">
      <header class="teacher-page__header">
        <div>
          <h1>Tus grupos tutorados</h1>
          <p>Gestiona la asistencia y el estado de tus grupos academicos asignados.</p>
        </div>
      </header>

      <div class="tutor-dashboard-layout">
        <section class="teacher-card tutor-groups-panel" aria-label="Grupos tutorados">
          <header class="tutor-groups-panel__header">
            <span class="teacher-group-chip">TICS</span>
            <span class="teacher-career-chip">Departamento tecnico</span>
          </header>

          <div class="teacher-tabs tutor-group-tabs" aria-label="Grupos">
            @for (group of groups(); track group.id) {
              <a
                [routerLink]="['/tutor/students']"
                [queryParams]="{ group: group.label }"
                [class.is-active]="group.id === '1-a'"
              >
                {{ group.label }}
              </a>
            }
          </div>

          <div class="tutor-list-heading">
            <strong>Listado de Grupo: 1-A</strong>
            <span>{{ totalStudents() }} alumnos inscritos</span>
          </div>

          <div class="tutor-student-preview-list">
            @for (student of previewStudents(); track student.id) {
              <a class="tutor-student-preview-row" [routerLink]="['/tutor/students', student.id]">
                <span class="avatar">{{ student.initials }}</span>
                <div>
                  <strong>{{ student.name }}</strong>
                  <small>ID: {{ student.enrollment }} - Estado: {{ student.status }}</small>
                </div>
                <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </a>
            }
          </div>

          <a class="btn-checkmate btn-checkmate-secondary tutor-full-list-link" routerLink="/tutor/students">
            + Ver lista completa del grupo
          </a>
        </section>

        <aside class="teacher-side-stack">
          <section class="teacher-card tutor-day-summary">
            <span>Resumen del dia</span>
            <div>
              <strong>Asistencia Hoy</strong>
              <b>{{ attendanceAverage() }}%</b>
            </div>
            <div class="tutor-progress" aria-hidden="true">
              <span [style.width.%]="attendanceAverage()"></span>
            </div>
            <dl>
              <div>
                <dt>Presentes</dt>
                <dd>88</dd>
              </div>
              <div>
                <dt>Ausentes</dt>
                <dd>6</dd>
              </div>
            </dl>
          </section>

          <figure class="teacher-monitor-card tutor-campus-card">
            <img src="/img/lp/Lp1.webp" alt="Vista del campus central" />
            <figcaption>
              <strong>Sede Central</strong>
              <span>Campus Norte - Taller de TICS</span>
            </figcaption>
          </figure>

          <section class="teacher-card tutor-alert-card">
            <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <div>
              <h2>Alerta de Inasistencia</h2>
              <p>3 alumnos de 2-A han faltado mas de 3 veces esta semana.</p>
              <a routerLink="/tutor/students" [queryParams]="{ risk: 'attendance' }">Ver detalles</a>
            </div>
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TutorDashboardComponent {
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly groups = this.tutoringData.groups;
  protected readonly students = this.tutoringData.students;
  protected readonly previewStudents = computed(() => this.students().slice(0, 4));
  protected readonly totalStudents = computed(() => this.students().length);
  protected readonly attendanceAverage = computed(() => {
    const students = this.students();

    if (!students.length) {
      return 0;
    }

    const total = students.reduce((sum, student) => sum + student.attendanceRate, 0);
    return Math.round(total / students.length);
  });
}
