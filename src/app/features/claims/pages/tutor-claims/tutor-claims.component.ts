import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-claims',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page tutor-claims-page">
      <header class="teacher-page__header teacher-page__header--filters">
        <div>
          <span class="teacher-kicker">Departamentos</span>
          <div class="tutor-department-tabs" aria-label="Departamentos">
            @for (department of departments(); track department) {
              <button
                type="button"
                [class.is-active]="activeDepartment() === department"
                (click)="activeDepartment.set(department)"
              >
                @if (department === 'TICS') {
                  <i class="fa-solid fa-computer" aria-hidden="true"></i>
                }
                {{ department }}
              </button>
            }
          </div>
        </div>

        <article class="teacher-card tutor-active-total">
          <span>Total activos</span>
          <strong>{{ activeClaims() }}</strong>
          <small>+2 reportados hoy</small>
        </article>
      </header>

      <div class="teacher-tabs tutor-filter-tabs" aria-label="Grupos">
        @for (group of groups(); track group) {
          <button
            type="button"
            [class.is-active]="activeGroup() === group"
            (click)="activeGroup.set(group)"
          >
            Grupo {{ group }}
          </button>
        }
      </div>

      <section class="teacher-table-card tutor-claims-list" aria-label="Reclamaciones">
        <div class="teacher-table">
          <div class="teacher-table__row teacher-table__row--header">
            <span>Estudiante / incidente</span>
            <span>Estado</span>
            <span>Fecha</span>
            <span></span>
          </div>
          @for (claim of filteredClaims(); track claim.id) {
            <a class="teacher-table__row tutor-claim-row" [routerLink]="['/tutor/claims', claim.id]">
              <div class="teacher-person-cell">
                <span class="avatar">{{ claim.studentName.slice(0, 2).toUpperCase() }}</span>
                <div>
                  <strong>{{ claim.studentName }} - <b>{{ claim.title }}</b></strong>
                  <small>Reportado en {{ claim.location }}</small>
                </div>
              </div>
              <app-status-badge [label]="claim.status" [tone]="claim.statusTone" />
              <span>{{ claim.reportedAt }}</span>
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </a>
          } @empty {
            <div class="teacher-table__row">
              <span>Sin reclamos para los filtros actuales.</span>
            </div>
          }
        </div>
      </section>

      <button type="button" class="tutor-floating-action" aria-label="Nuevo reclamo" (click)="showCreateClaimInfo()">
        <i class="fa-solid fa-plus" aria-hidden="true"></i>
      </button>
    </section>
  `,
})
export class TutorClaimsComponent {
  private readonly tutoringData = inject(TutoringDataService);
  private readonly toastService = inject(ToastService);

  protected readonly claims = this.tutoringData.claims;
  protected readonly activeClaims = this.tutoringData.activeClaims;
  protected readonly departments = computed(() =>
    Array.from(new Set(this.claims().map((claim) => claim.location).filter(Boolean))),
  );
  protected readonly groups = computed(() =>
    Array.from(new Set(this.claims().map((claim) => claim.group).filter(Boolean))),
  );
  protected readonly activeDepartment = signal('TICS');
  protected readonly activeGroup = signal('');
  protected readonly filteredClaims = computed(() =>
    this.claims().filter((claim) => {
      const group = this.activeGroup();
      return !group || claim.group === group;
    }),
  );

  protected showCreateClaimInfo(): void {
    this.toastService.info(
      'Reclamos de alumnos',
      'Los reclamos nuevos se crean desde el portal del alumno. Aqui puedes darles seguimiento.',
    );
  }
}
