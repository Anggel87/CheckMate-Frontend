import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TutoringDataService } from '../../data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-student-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page teacher-student-profile-page">
      <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
        <a routerLink="/tutor/dashboard">Dashboard</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <a routerLink="/tutor/students">Alumnos</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Perfil del alumno</strong>
      </nav>

      <article class="teacher-card teacher-student-hero">
        @if (student().avatarUrl) {
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
        } @else {
          <span class="avatar tutor-profile-avatar">{{ student().initials }}</span>
        }
        <div>
          <h1>{{ student().name }}</h1>
          <div class="badge-row">
            <app-status-badge [label]="'Grupo ' + student().group" tone="danger" />
            <app-status-badge [label]="'Departamento ' + student().department" tone="neutral" />
          </div>
          <dl class="teacher-student-hero__stats">
            <div>
              <dt>Asistencia</dt>
              <dd>{{ student().attendanceRate }}%</dd>
            </div>
            <div>
              <dt>Conducta</dt>
              <dd>A-</dd>
            </div>
            <div>
              <dt>Justificantes</dt>
              <dd>{{ student().justificationCount }}</dd>
            </div>
          </dl>
        </div>
        <div class="tutor-profile-actions">
          <a class="btn-checkmate btn-checkmate-secondary" [routerLink]="['/tutor/students', student().id, 'attendance']">
            <i class="fa-regular fa-calendar-check" aria-hidden="true"></i>
            Ver asistencias
          </a>
          <a class="btn-checkmate btn-checkmate-primary" [href]="'mailto:' + student().email">
            <i class="fa-regular fa-envelope" aria-hidden="true"></i>
            Contactar
          </a>
        </div>
      </article>

      <nav class="teacher-profile-tabs" aria-label="Secciones del alumno">
        <a class="is-active" [routerLink]="['/tutor/students', student().id]">Asistencias</a>
        <a [routerLink]="['/tutor/students', student().id, 'justifications']">Justificantes</a>
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
              <a [routerLink]="['/tutor/students', student().id, 'attendance']">Ver todo</a>
            </header>
            <div class="teacher-activity-list">
              <article>
                <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
                <div>
                  <strong>Asistencia confirmada</strong>
                  <span>Base de datos - 08:30 AM</span>
                </div>
                <time>Hoy</time>
              </article>
              <article>
                <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                <div>
                  <strong>Justificante entregado</strong>
                  <span>Archivo: med_record_002.pdf</span>
                </div>
                <time>Ayer</time>
              </article>
              <article class="is-danger">
                <i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>
                <div>
                  <strong>Inasistencia registrada</strong>
                  <span>Matematicas Avanzadas - 10:00 AM</span>
                </div>
                <time>12 Oct</time>
              </article>
            </div>
          </section>
        </div>

        <aside class="teacher-side-stack">
          <section class="teacher-card teacher-student-details-card">
            <h2><i class="fa-regular fa-user" aria-hidden="true"></i> Detalles del alumno</h2>
            <dl>
              <div>
                <dt>Matricula</dt>
                <dd>{{ student().enrollment }}</dd>
              </div>
              <div>
                <dt>Correo institucional</dt>
                <dd>{{ student().email }}</dd>
              </div>
              <div>
                <dt>Tutor asignado</dt>
                <dd>{{ student().tutor }}</dd>
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
              <i class="fa-solid fa-star-of-life" aria-hidden="true"></i> Contacto de emergencia
            </h2>
            <p>{{ student().emergencyContact }}</p>
            <strong>{{ student().emergencyPhone }}</strong>
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TutorStudentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly tutoringData = inject(TutoringDataService);

  protected readonly student = computed(() =>
    this.tutoringData.studentById(this.route.snapshot.paramMap.get('studentId')),
  );
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
