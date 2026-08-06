import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { STUDENT_CLAIMS } from '../../../../core/mocks/student.mock';

@Component({
  selector: 'app-student-claims',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="student-page">
      <header class="student-page__header student-page__header--action">
        <div>
          <h1>Mis Reclamos</h1>
          <p>Gestiona y da seguimiento a tus solicitudes e incidencias.</p>
        </div>

        <a class="btn-checkmate btn-checkmate-primary" routerLink="/student/claims/new">
          <i class="fa-solid fa-plus" aria-hidden="true"></i>
          <span>Nuevo Reclamo</span>
        </a>
      </header>

      <section class="student-claims-summary">
        <article class="student-card student-total-card">
          <span>Total Reclamos</span>
          <strong>12 <small>este semestre</small></strong>
          <i class="fa-regular fa-clipboard" aria-hidden="true"></i>
        </article>

        <article class="student-card student-status-summary">
          <span>Estado Actual</span>
          <div>
            <strong
              ><i class="student-dot student-dot--late"></i>4 <small>Pendientes</small></strong
            >
            <strong
              ><i class="student-dot student-dot--justified"></i>3
              <small>En revision</small></strong
            >
            <strong
              ><i class="student-dot student-dot--present"></i>5 <small>Aprobados</small></strong
            >
          </div>
        </article>
      </section>

      <article class="student-card student-table-card">
        <header class="student-table-header">
          <h2>Historial de Reclamos</h2>
          <div class="student-table-filters">
            <button type="button" class="btn-checkmate btn-checkmate-secondary">
              Filtrar por fecha
              <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
            <button type="button" class="btn-checkmate btn-checkmate-secondary">
              Todos los estados
              <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
            </button>
          </div>
        </header>

        <div class="student-table-wrapper">
          <table class="student-table">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Motivo</th>
                <th scope="col">Estado</th>
                <th scope="col">Accion</th>
              </tr>
            </thead>
            <tbody>
              @for (claim of claims; track claim.id) {
                <tr>
                  <td>{{ claim.date }}</td>
                  <td>
                    <strong>{{ claim.title }}</strong>
                    <small>{{ claim.description }}</small>
                  </td>
                  <td><app-status-badge [label]="claim.status" [tone]="claim.statusTone" /></td>
                  <td>
                    <button
                      type="button"
                      class="student-icon-button"
                      [attr.aria-label]="'Ver ' + claim.title"
                    >
                      <i class="fa-regular fa-eye" aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <footer class="student-table-footer">
          <span>Mostrando 1 a 4 de 12 reclamos</span>
          <div class="student-pagination" aria-label="Paginacion de reclamos">
            <button type="button" disabled aria-label="Pagina anterior">
              <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" aria-label="Pagina siguiente">
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </footer>
      </article>
    </section>
  `,
})
export class StudentClaimsComponent {
  protected readonly claims = STUDENT_CLAIMS;
}
