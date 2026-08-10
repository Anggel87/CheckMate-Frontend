import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  TutoringDataService,
  emptyTutorAttendanceRecord,
} from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-attendance-record-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
        <a [routerLink]="['/tutor/students', student().id, 'attendance']">Asistencias</a>
        <span>/</span>
        <strong>{{ record().date }}</strong>
      </nav>

      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <h1>Detalle de asistencia</h1>
          <p>Registro individual asociado al alumno tutorado.</p>
        </div>
        <div class="teacher-filter-actions">
          <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/tutor/students', student().id, 'attendance']">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Volver
          </a>
          @if (record().status === 'Inasistencia') {
            <a
              class="btn-checkmate btn-checkmate-primary"
              routerLink="/tutor/justifications/new"
              [queryParams]="{ student: student().id, attendance: record().id }"
            >
              <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
              Crear justificante
            </a>
          }
        </div>
      </header>

      <div class="teacher-incident-detail-layout tutor-record-detail-layout">
        <article class="teacher-card teacher-incident-report tutor-record-detail-card">
          <header>
            <span class="teacher-report-icon">
              <i class="fa-regular fa-calendar-check" aria-hidden="true"></i>
            </span>
            <div>
              <span class="teacher-kicker">Registro<br />{{ record().date }}</span>
              <h1>{{ record().subject }}</h1>
            </div>
          </header>

          <section class="teacher-report-grid" aria-label="Datos de asistencia">
            <div>
              <span>Estado</span>
              <app-status-badge [label]="record().status" [tone]="record().statusTone" />
            </div>
            <div>
              <span>Hora registrada</span>
              <strong>{{ record().time }}</strong>
            </div>
            <div>
              <span>Fuente</span>
              <strong>{{ record().source }}</strong>
            </div>
          </section>

          <section class="teacher-report-section">
            <h2>Observaciones</h2>
            <p>{{ record().observation }}</p>
          </section>
        </article>

        <aside class="teacher-side-stack">
          <section class="teacher-card teacher-student-details-card">
            <h2><i class="fa-regular fa-user" aria-hidden="true"></i> Alumno</h2>
            <dl>
              <div>
                <dt>Nombre</dt>
                <dd>{{ student().name }}</dd>
              </div>
              <div>
                <dt>Matricula</dt>
                <dd>{{ student().enrollment }}</dd>
              </div>
              <div>
                <dt>Aula</dt>
                <dd>{{ record().classroom }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TutorAttendanceRecordDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );
  protected readonly record = computed(
    () =>
      this.tutoringData.attendanceById(this.route.snapshot.paramMap.get('recordId')) ??
      this.tutoringData.attendanceForStudent(this.student().id)[0] ??
      this.tutoringData.attendanceRecords()[0] ??
      emptyTutorAttendanceRecord(),
  );
}
