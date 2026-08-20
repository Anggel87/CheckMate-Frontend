import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  StudentAttendanceRecordView,
  StudentCourseView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

const EMPTY_SUBJECT: StudentCourseView = {
  id: '',
  name: 'Materia',
  teacher: '',
  teacherId: '',
  group: '',
  schedule: '',
  location: '',
  attendance: 0,
  icon: 'fa-regular fa-bookmark',
  tone: 'neutral',
  presentCount: 0,
  lateCount: 0,
  absentCount: 0,
};

@Component({
  selector: 'app-student-subject-detail',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/subjects">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando informacion de la materia..." [showLabel]="true" />
      } @else {
        <header class="student-page__header">
          <div>
            <h1>{{ subject().name }}</h1>
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
              <dd>
                @if (subject().teacherId) {
                  <a [routerLink]="['/student/teachers', subject().teacherId]">{{ subject().teacher }}</a>
                } @else {
                  Sin docente registrado
                }
              </dd>
            </div>
            <div>
              <dt>
                <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                  <i class="fa-regular fa-clock"></i>
                </span>
                Horario
              </dt>
              <dd>{{ subject().schedule || 'Sin horario activo' }}</dd>
            </div>
            <div>
              <dt>
                <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
                  <i class="fa-solid fa-location-dot"></i>
                </span>
                Salon
              </dt>
              <dd>{{ subject().location || 'Sin aula asignada' }}</dd>
            </div>
          </dl>
        </article>

        <section class="student-stat-grid student-stat-grid--four" aria-label="Resumen de la materia">
          <article class="student-card student-compact-stat">
            <span><i class="fa-solid fa-percent" aria-hidden="true"></i> Asistencia</span>
            <strong class="is-success">{{ subject().attendance }}%</strong>
            <div class="student-progress"><span [style.width.%]="subject().attendance"></span></div>
          </article>
          <article class="student-card student-compact-stat">
            <span><i class="fa-solid fa-check-double" aria-hidden="true"></i> Presentes</span>
            <strong>{{ subject().presentCount }}</strong>
          </article>
          <article class="student-card student-compact-stat">
            <span><i class="fa-regular fa-clock" aria-hidden="true"></i> Retardos</span>
            <strong class="is-warning">{{ subject().lateCount }}</strong>
          </article>
          <article class="student-card student-compact-stat">
            <span><i class="fa-regular fa-circle-xmark" aria-hidden="true"></i> Faltas</span>
            <strong class="is-danger">{{ subject().absentCount }}</strong>
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

          @if (history().length === 0) {
            <p class="dropdown-empty">Sin asistencias registradas para esta materia.</p>
          } @else {
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
                  @for (record of history(); track record.id) {
                    <tr>
                      <td>{{ record.date }}</td>
                      <td>{{ record.time }}</td>
                      <td><app-status-badge [label]="record.status" [tone]="record.statusTone" /></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </article>
      }
    </section>
  `,
})
export class StudentSubjectDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(true);
  protected readonly subject = signal<StudentCourseView>(EMPTY_SUBJECT);
  protected readonly history = signal<StudentAttendanceRecordView[]>([]);

  constructor() {
    this.studentApi
      .getSubjectDetail(this.route.snapshot.paramMap.get('subjectId') ?? '')
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ subject, history }) => {
        this.subject.set(subject);
        this.history.set(history);
      });
  }
}
