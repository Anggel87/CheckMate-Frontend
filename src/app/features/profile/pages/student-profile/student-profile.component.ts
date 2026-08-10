import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  EMPTY_STUDENT_PROFILE,
  StudentPortalApiService,
  StudentProfileView,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mi Informacion</h1>
          <p>Consulta y gestiona tu perfil academico.</p>
        </div>

        <button type="button" class="btn-checkmate btn-checkmate-primary">
          <i class="fa-solid fa-pen" aria-hidden="true"></i>
          <span>Editar Datos</span>
        </button>
      </header>

      <section class="student-profile-grid">
        <article class="student-card student-profile-card">
          <img
            class="student-profile-card__avatar"
            [src]="profile.avatarUrl"
            [alt]="'Foto de perfil de ' + profile.name"
          />

          <div class="student-profile-card__content">
            <h2>{{ profile.name }}</h2>
            <p>{{ profile.role }}</p>

            <div class="student-chip-row">
              <span class="student-info-chip">
                <i class="fa-solid fa-id-card-clip" aria-hidden="true"></i>
                <span>Matricula</span>
                <strong>{{ profile.enrollment }}</strong>
              </span>
              <span class="student-info-chip">
                <i class="fa-solid fa-users" aria-hidden="true"></i>
                <span>Grupo / Carrera</span>
                <strong>{{ profile.groupCareer }}</strong>
              </span>
            </div>
          </div>
        </article>

        <article class="student-card student-current-status-card">
          <h2>
            <i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i>
            Estado Actual
          </h2>
          <div class="student-progress-row">
            <span>Asistencia Total</span>
            <strong>{{ profile.attendanceTotal }}%</strong>
          </div>
          <div class="student-progress" [attr.aria-label]="'Asistencia total ' + profile.attendanceTotal + '%'">
            <span [style.width.%]="profile.attendanceTotal"></span>
          </div>
        </article>
      </section>

      <article class="student-card student-contact-card">
        <header>
          <h2>Informacion de Contacto</h2>
        </header>

        <div class="student-contact-grid">
          <label>
            <span>
              <i class="fa-regular fa-envelope" aria-hidden="true"></i>
              Correo Institucional
            </span>
            <input class="checkmate-input" type="email" [value]="profile.email" readonly />
          </label>

          <label>
            <span>
              <i class="fa-solid fa-phone" aria-hidden="true"></i>
              Telefono Movil
            </span>
            <input class="checkmate-input" type="tel" [value]="profile.phone" readonly />
          </label>

          <label>
            <span>
              <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
              Tutor Legal
            </span>
            <input class="checkmate-input" type="text" [value]="profile.guardian" readonly />
          </label>

          <label class="student-contact-grid__wide">
            <span>
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              Direccion Registrada
            </span>
            <input class="checkmate-input" type="text" [value]="profile.address" readonly />
          </label>
        </div>
      </article>

      <section class="student-profile-shortcuts" aria-label="Accesos de perfil">
        <a class="student-card student-action-row" routerLink="/student/attendance">
          <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
            <i class="fa-regular fa-calendar-check"></i>
          </span>
          <span>
            <strong>Mis Asistencias</strong>
            <small>Ver historial completo</small>
          </span>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>

        <a class="student-card student-action-row" routerLink="/student/justifications">
          <span class="student-icon-bubble student-icon-bubble--neutral" aria-hidden="true">
            <i class="fa-regular fa-file-lines"></i>
          </span>
          <span>
            <strong>Mis Justificantes</strong>
            <small>Gestionar documentos</small>
          </span>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      </section>

      <a
        class="btn-checkmate btn-checkmate-primary student-full-action"
        routerLink="/student/subjects"
      >
        Mis materias
      </a>
    </section>
  `,
})
export class StudentProfileComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);

  protected profile: StudentProfileView = EMPTY_STUDENT_PROFILE;

  constructor() {
    this.studentApi
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dashboard) => {
        this.profile = dashboard.profile;
      });
  }
}
