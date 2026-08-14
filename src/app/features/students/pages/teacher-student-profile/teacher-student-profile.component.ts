import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_TEACHER_STUDENT_PROFILE,
  TeacherPortalApiService,
  TeacherStudentProfileView,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-student-profile',
  standalone: true,
  imports: [RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="teacher-page teacher-student-profile-page">
      <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
        <a routerLink="/teacher/dashboard">Dashboard</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <a routerLink="/teacher/groups">Alumnos</a>
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        <strong>Perfil del Alumno</strong>
      </nav>

      @if (loading()) {
        <app-loading-spinner label="Cargando alumno..." [showLabel]="true" />
      } @else {
        <article class="teacher-card teacher-student-hero">
          <img [src]="student().avatarUrl" [alt]="'Foto de ' + student().name" />
          <div>
            <h1>{{ student().name || 'Alumno' }}</h1>
            <div class="badge-row">
              <app-status-badge [label]="student().group || 'Sin grupo'" tone="danger" />
              <app-status-badge [label]="student().department || 'Sin carrera'" tone="neutral" />
            </div>
            <dl class="teacher-student-hero__stats">
              <div>
                <dt>Asistencia</dt>
                <dd>{{ student().attendance }}%</dd>
              </div>
              <div>
                <dt>Justificantes</dt>
                <dd>{{ student().justifications }}</dd>
              </div>
            </dl>
          </div>
          <a class="btn-checkmate btn-checkmate-primary" [href]="'mailto:' + student().email">
            <i class="fa-regular fa-envelope" aria-hidden="true"></i>
            Contactar
          </a>
        </article>

        <nav class="teacher-profile-tabs" aria-label="Secciones del alumno">
          <a class="is-active" [routerLink]="['/teacher/students', student().id]">Asistencias</a>
          <a [routerLink]="['/teacher/students', student().id, 'justifications']">Justificantes</a>
        </nav>

        <div class="teacher-profile-layout">
          <div class="teacher-profile-main">
            <section class="teacher-card teacher-activity-card">
              <header>
                <h2>Actividad Reciente</h2>
                <a [routerLink]="['/teacher/students', student().id, 'attendance']">Ver todo</a>
              </header>
              <p class="dropdown-empty">Consulta el historial completo en Asistencias.</p>
            </section>
          </div>

          <aside class="teacher-side-stack">
            <section class="teacher-card teacher-student-details-card">
              <h2><i class="fa-regular fa-user" aria-hidden="true"></i> Detalles del Alumno</h2>
              <dl>
                <div>
                  <dt>Matricula</dt>
                  <dd>{{ student().enrollment }}</dd>
                </div>
                <div>
                  <dt>Correo Institucional</dt>
                  <dd>{{ student().email }}</dd>
                </div>
                <div>
                  <dt>Tutor Académico</dt>
                  <dd>{{ student().academicTutor || 'Sin tutor académico asignado' }}</dd>
                </div>
              </dl>
            </section>

            <section class="teacher-card teacher-student-tutors-card">
              <h2><i class="fa-solid fa-user-shield" aria-hidden="true"></i> Tutores Legales</h2>

              @if (student().tutors.length) {
                @for (tutor of student().tutors; track tutor.id) {
                  <div class="management-tutor-row">
                    <div>
                      <strong>{{ tutor.fullName }}</strong>
                      <small>{{ tutor.relationship }}{{ tutor.isPrimary ? ' · Principal' : '' }}</small>
                    </div>
                    <span>{{ tutor.phone || 'Sin telefono' }}</span>
                  </div>
                }
              } @else {
                <p class="dropdown-empty">Sin tutores legales registrados.</p>
              }
            </section>
          </aside>
        </div>
      }
    </section>
  `,
})
export class TeacherStudentProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly student = signal<TeacherStudentProfileView>(EMPTY_TEACHER_STUDENT_PROFILE);

  constructor() {
    this.teacherApi
      .getStudentProfile(this.route.snapshot.paramMap.get('studentId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((student) => {
        this.student.set(student);
      });
  }
}
