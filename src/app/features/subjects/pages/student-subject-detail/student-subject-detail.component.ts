import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  STUDENT_SUBJECT_HISTORY,
  STUDENT_SUBJECTS,
  StudentCourseMock,
} from '../../../../core/mocks/student.mock';

@Component({
  selector: 'app-student-subject-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/subjects">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver
      </a>

      <header class="student-page__header">
        <div>
          <h1>{{ subject.name }}</h1>
        </div>
      </header>

      <article class="student-card student-course-info-card">
        <h2>Informacion del Curso</h2>

        <dl>
          <div>
            <dt>
              <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                <i class="fa-regular fa-user"></i>
              </span>
              Docente
            </dt>
            <dd>{{ subject.teacher }}</dd>
          </div>
          <div>
            <dt>
              <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                <i class="fa-regular fa-clock"></i>
              </span>
              Horario
            </dt>
            <dd>{{ subject.schedule }}</dd>
          </div>
          <div>
            <dt>
              <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                <i class="fa-solid fa-location-dot"></i>
              </span>
              Salon
            </dt>
            <dd>{{ subject.location }}</dd>
          </div>
        </dl>
      </article>

      <section class="student-stat-grid student-stat-grid--four" aria-label="Resumen de la materia">
        <article class="student-card student-compact-stat">
          <span><i class="fa-solid fa-percent" aria-hidden="true"></i> Asistencia</span>
          <strong class="is-success">{{ subject.attendance }}%</strong>
          <div class="student-progress"><span [style.width.%]="subject.attendance"></span></div>
        </article>
        <article class="student-card student-compact-stat">
          <span><i class="fa-solid fa-check-double" aria-hidden="true"></i> Presentes</span>
          <strong>{{ subject.presentCount }}</strong>
        </article>
        <article class="student-card student-compact-stat">
          <span><i class="fa-regular fa-clock" aria-hidden="true"></i> Retardos</span>
          <strong class="is-warning">{{ subject.lateCount }}</strong>
        </article>
        <article class="student-card student-compact-stat">
          <span><i class="fa-regular fa-circle-xmark" aria-hidden="true"></i> Faltas</span>
          <strong class="is-danger">{{ subject.absentCount }}</strong>
        </article>
      </section>

      <article class="student-card student-table-card">
        <header class="student-table-header">
          <h2>Historial de Asistencias</h2>
          <button type="button" class="student-filter-link">
            Filtrar
            <i class="fa-solid fa-filter" aria-hidden="true"></i>
          </button>
        </header>

        <div class="student-table-wrapper">
          <table class="student-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Horario</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (record of history; track record.id) {
                <tr>
                  <td>{{ record.date }}</td>
                  <td>{{ record.time }}</td>
                  <td><app-status-badge [label]="record.status" [tone]="record.statusTone" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <button type="button" class="student-load-more">Cargar mas registros</button>
      </article>
    </section>
  `,
})
export class StudentSubjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly subjectId = this.route.snapshot.paramMap.get('subjectId');

  protected readonly subject: StudentCourseMock =
    STUDENT_SUBJECTS.find((subject) => subject.id === this.subjectId) ?? STUDENT_SUBJECTS[0]!;
  protected readonly history = STUDENT_SUBJECT_HISTORY;
}
