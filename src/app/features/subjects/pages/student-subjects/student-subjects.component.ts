import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { STUDENT_SUBJECTS } from '../../../../core/mocks/student.mock';

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="student-page">
      <header class="student-page__header">
        <div>
          <h1>Mis Materias</h1>
          <p>Consulta la informacion detallada de tus cursos actuales.</p>
        </div>
      </header>

      <section class="student-subject-grid" aria-label="Materias actuales">
        @for (subject of subjects; track subject.id) {
          <article class="student-card student-subject-card">
            <header>
              <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                <i [class]="subject.icon"></i>
              </span>
              <span
                class="student-subject-attendance"
                [class]="'student-subject-attendance student-subject-attendance--' + subject.tone"
              >
                {{ subject.attendance }}% Asistencia
              </span>
            </header>

            <h2>{{ subject.name }}</h2>
            <p>{{ subject.teacher }}</p>

            <dl>
              <div>
                <dt><i class="fa-regular fa-clock" aria-hidden="true"></i></dt>
                <dd>{{ subject.schedule }}</dd>
              </div>
              <div>
                <dt><i class="fa-regular fa-building" aria-hidden="true"></i></dt>
                <dd>{{ subject.location }}</dd>
              </div>
            </dl>

            <a class="student-card-link" [routerLink]="['/student/subjects', subject.id]"
              >Ver Detalles</a
            >
          </article>
        }
      </section>
    </section>
  `,
})
export class StudentSubjectsComponent {
  protected readonly subjects = STUDENT_SUBJECTS;
}
