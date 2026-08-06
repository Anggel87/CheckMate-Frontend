import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TEACHER_STUDENT_JUSTIFICATIONS,
  TEACHER_STUDENT_PROFILE,
} from '../../../../core/mocks/teacher.mock';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-student-justifications',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
        <a routerLink="/teacher/groups">Mis grupos</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <a routerLink="/teacher/groups/1-a/students">Alejandro Gomez</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Justificantes</strong>
      </nav>

      <article class="teacher-student-inline-profile">
        <img [src]="student.avatarUrl" [alt]="'Foto de ' + student.fullName" />
        <div>
          <h1>Alejandro Gomez Perez</h1>
          <p>Matricula: A01234567 • Grupo: 4B</p>
        </div>
      </article>

      <section class="teacher-table-card" aria-label="Historial de justificantes">
        <header class="teacher-table-card__header">
          <h2>Historial de Justificantes</h2>
          <div class="teacher-filter-actions">
            <button type="button" class="teacher-filter-button">
              Filtrar por fecha <i class="fa-solid fa-chevron-down"></i>
            </button>
            <button type="button" class="teacher-filter-button">
              Todos los tipos <i class="fa-solid fa-chevron-down"></i>
            </button>
          </div>
        </header>

        <div class="teacher-table teacher-justifications-table">
          <div class="teacher-table__row teacher-table__row--header">
            <span>Fecha</span>
            <span>Tipo</span>
            <span>Materia</span>
            <span>Evidencia</span>
            <span>Accion</span>
          </div>
          @for (record of records; track record.id) {
            <div class="teacher-table__row">
              <span>{{ record.date }}</span>
              <app-status-badge [label]="record.type" [tone]="record.typeTone" />
              <span>{{ record.subject }}</span>
              <i [class]="record.evidenceIcon" aria-hidden="true"></i>
              <button
                type="button"
                class="icon-button"
                [attr.aria-label]="'Ver justificante ' + record.date"
              >
                <i class="fa-regular fa-eye" aria-hidden="true"></i>
              </button>
            </div>
          }
        </div>

        <footer class="teacher-table-footer">
          <span>Mostrando 3 justificantes</span>
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
export class TeacherStudentJustificationsComponent {
  protected readonly student = TEACHER_STUDENT_PROFILE;
  protected readonly records = TEACHER_STUDENT_JUSTIFICATIONS;
}
