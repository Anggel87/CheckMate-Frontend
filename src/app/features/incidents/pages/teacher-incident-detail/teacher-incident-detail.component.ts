import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-teacher-incident-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page teacher-incident-detail-page">
      <header class="teacher-detail-actions">
        <nav class="breadcrumbs" aria-label="Ruta de navegacion">
          <a routerLink="/teacher/dashboard"
            ><i class="fa-solid fa-house" aria-hidden="true"></i
          ></a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <a routerLink="/teacher/incidents">Claims</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <strong>Incident #2026-0320</strong>
        </nav>

        <div>
          <button type="button" class="btn-checkmate btn-checkmate-secondary">
            <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
            Export Report
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-primary">
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
            Edit
          </button>
        </div>
      </header>

      <div class="teacher-incident-detail-layout">
        <article class="teacher-card teacher-incident-report">
          <span class="teacher-incident-ribbon">Active</span>
          <header>
            <span class="teacher-report-icon"><i class="fa-solid fa-fire-flame-curved"></i></span>
            <div>
              <span class="teacher-kicker">Incident Reference<br />20/March/2026</span>
              <h1>incendio</h1>
            </div>
          </header>

          <section class="teacher-report-grid" aria-label="Datos del incidente">
            <div>
              <span>Emergency Type</span>
              <strong class="is-danger">Fire / Structural</strong>
            </div>
            <div>
              <span>Reporter</span>
              <strong>Matador Lopez</strong>
            </div>
            <div>
              <span>Response Phase</span>
              <strong>Containment</strong>
            </div>
          </section>

          <section class="teacher-report-section">
            <h2>Description</h2>
            <p>
              Fuego en CADI. Preliminary reports indicate the ignition originated in the electrical
              closet of the West Wing. Initial suppression systems were activated at 14:22. Local
              fire department has been dispatched and is currently on-site. Building evacuation
              complete.
            </p>
          </section>

          <section class="teacher-report-section">
            <h2>Field Evidence</h2>
            <div class="teacher-evidence-grid">
              <figure class="teacher-evidence-card teacher-evidence-card--building">
                <figcaption>Fachada del edificio</figcaption>
              </figure>
              <figure class="teacher-evidence-card teacher-evidence-card--electrical">
                <figcaption>Panel electrico afectado</figcaption>
              </figure>
            </div>
          </section>
        </article>

        <aside class="teacher-side-stack">
          <article class="teacher-card teacher-location-card">
            <h2>Location Context</h2>
            <div class="teacher-location-map" aria-hidden="true"></div>
            <strong><i class="fa-solid fa-location-dot"></i> CADI Innovation Center</strong>
            <p>Calle de la Tecnologia, 42, West Wing, 2nd Floor. Madrid, ES.</p>
          </article>

          <article class="teacher-card teacher-attendance-status-card">
            <header>
              <h2>Attendance Status</h2>
              <span>12/14 Checked</span>
            </header>
            <div class="teacher-response-list">
              <div class="is-missing">
                <span>JS</span><strong>Julian Sanchez</strong
                ><app-status-badge label="Missing" tone="danger" />
              </div>
              <div class="is-safe">
                <span>MR</span><strong>Maria Rodriguez</strong
                ><app-status-badge label="Safe" tone="success" />
              </div>
              <div class="is-safe">
                <span>PL</span><strong>Pablo Lopez</strong
                ><app-status-badge label="Safe" tone="success" />
              </div>
            </div>
            <button type="button" class="btn-checkmate btn-checkmate-secondary">
              View All 14 Personnel
            </button>
          </article>

          <article class="teacher-card teacher-timeline-card">
            <h2>Event Timeline</h2>
            <ol>
              <li>
                <strong>14:22 - Incident Logged</strong>
                <span>System trigger via smoke detector SD-42.</span>
              </li>
              <li>
                <strong>14:24 - Manual Update</strong>
                <span>Verified by Matador Lopez. Photos added.</span>
              </li>
            </ol>
          </article>
        </aside>
      </div>
    </section>
  `,
})
export class TeacherIncidentDetailComponent {}
