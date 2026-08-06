import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { STUDENT_ATTENDANCE_DETAIL } from '../../../../core/mocks/student.mock';

@Component({
  selector: 'app-student-attendance-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/attendance/history">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Asistencias
      </a>

      <header class="student-page__header">
        <div>
          <h1>Detalle de Asistencia</h1>
        </div>
      </header>

      <section class="student-detail-grid">
        <article class="student-card student-attendance-detail-card">
          <header>
            <div>
              <h2>{{ detail.subject }}</h2>
              <p>{{ detail.teacher }}</p>
            </div>
            <app-status-badge [label]="detail.status" tone="absent" />
          </header>

          <dl class="student-detail-list">
            <div>
              <dt>Fecha</dt>
              <dd>{{ detail.date }}</dd>
            </div>
            <div>
              <dt>Horario Programado</dt>
              <dd>{{ detail.scheduledTime }}</dd>
            </div>
            <div>
              <dt>Hora de Registro</dt>
              <dd>{{ detail.registeredTime }}</dd>
            </div>
            <div>
              <dt>Aula</dt>
              <dd>{{ detail.classroom }}</dd>
            </div>
          </dl>

          <section class="student-observation">
            <h3>Observaciones</h3>
            <p>{{ detail.observations }}</p>
          </section>
        </article>

        <aside class="student-card student-help-card">
          <h2>
            <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
            Hay algun error?
          </h2>
          <p>
            Si consideras que esta asistencia es incorrecta o tienes un comprobante valido, puedes
            iniciar un proceso de reclamo o adjuntar un justificante.
          </p>

          <a class="btn-checkmate btn-checkmate-info" routerLink="/student/claims/new">
            <i class="fa-solid fa-bullhorn" aria-hidden="true"></i>
            Crear Reclamo
          </a>
          <a
            class="btn-checkmate btn-checkmate-secondary"
            routerLink="/student/justifications/select-absence"
          >
            <i class="fa-regular fa-file-arrow-up" aria-hidden="true"></i>
            Subir Justificante
          </a>
        </aside>
      </section>
    </section>
  `,
})
export class StudentAttendanceDetailComponent {
  protected readonly detail = STUDENT_ATTENDANCE_DETAIL;
}
