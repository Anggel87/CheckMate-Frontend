import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-student-justifications',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
        <a routerLink="/tutor/students">Alumnos tutorados</a>
        <span>/</span>
        <a [routerLink]="['/tutor/students', student().id]">{{ student().name }}</a>
        <span>/</span>
        <strong>Justificantes</strong>
      </nav>

      <article class="teacher-student-inline-profile">
        @if (student().avatarUrl) {
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
        } @else {
          <span class="avatar">{{ student().initials }}</span>
        }
        <div>
          <h1>{{ student().name }}</h1>
          <p>ID: {{ student().enrollment }} - Grupo: {{ student().group }}</p>
        </div>
      </article>

      <section class="teacher-table-card" aria-label="Historial de justificantes">
        <header class="teacher-table-card__header">
          <h2>Historial de justificantes</h2>
          <div class="teacher-filter-actions">
            <a class="btn-checkmate btn-checkmate-primary" routerLink="/tutor/justifications/new" [queryParams]="{ student: student().id }">
              <i class="fa-solid fa-plus" aria-hidden="true"></i>
              Nuevo justificante
            </a>
          </div>
        </header>

        @if (records().length === 0) {
          <app-empty-state
            icon="fa-regular fa-file-lines"
            title="Sin justificantes"
            description="Este alumno todavia no tiene justificantes registrados."
          />
        } @else {
          <div class="teacher-table teacher-justifications-table">
            <div class="teacher-table__row teacher-table__row--header">
              <span>Fecha</span>
              <span>Tipo</span>
              <span>Materia</span>
              <span>Estado</span>
              <span>Accion</span>
            </div>
            @for (record of records(); track record.id) {
              <div class="teacher-table__row">
                <span>{{ record.absenceDate }}</span>
                <app-status-badge [label]="record.type" tone="info" />
                <span>{{ record.subject }}</span>
                <app-status-badge [label]="record.status" [tone]="record.statusTone" />
                <a class="icon-button" [routerLink]="['/tutor/justifications', record.id]" [attr.aria-label]="'Ver ' + record.title">
                  <i class="fa-regular fa-eye" aria-hidden="true"></i>
                </a>
              </div>
            }
          </div>
        }
      </section>
    </section>
  `,
})
export class TutorStudentJustificationsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );

  constructor() {
    const studentId = this.route.snapshot.paramMap.get('studentId');

    if (studentId) {
      this.tutoringData.loadStudentJustifications(studentId);
    }
  }

  protected readonly records = computed(() =>
    this.tutoringData
      .justifications()
      .filter((justification) => justification.studentId === this.student().id),
  );
}
