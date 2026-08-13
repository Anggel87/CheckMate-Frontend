import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_STUDENT_CLAIM_DETAIL,
  StudentClaimDetailView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-claim-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/claims">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Mis Reclamos
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando reclamo..." [showLabel]="true" />
      } @else {
        <article class="student-card student-attendance-detail-card">
          <header>
            <div>
              <h1>{{ detail().subject || 'Reclamo' }}</h1>
              <p>{{ detail().date }}</p>
            </div>
            <app-status-badge [label]="detail().status || 'Sin estado'" [tone]="detail().statusTone" />
          </header>

          <dl class="student-detail-list">
            <div>
              <dt>Descripcion</dt>
              <dd>{{ detail().description }}</dd>
            </div>
            @if (detail().teacher) {
              <div>
                <dt>Profesor</dt>
                <dd>{{ detail().teacher }}</dd>
              </div>
            }
          </dl>

          <section class="student-observation">
            <h3>Evidencia</h3>
            @if (detail().evidenceUrl) {
              <a class="btn-checkmate btn-checkmate-secondary" [href]="detail().evidenceUrl" target="_blank" rel="noopener">
                <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                Ver evidencia adjunta
              </a>
            } @else {
              <p>Sin evidencia adjunta.</p>
            }
          </section>
        </article>
      }
    </section>
  `,
})
export class StudentClaimDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly studentApi = inject(StudentPortalApiService);

  protected readonly loading = signal(true);
  protected readonly detail = signal<StudentClaimDetailView>(EMPTY_STUDENT_CLAIM_DETAIL);

  constructor() {
    this.studentApi
      .getClaimDetail(this.route.snapshot.paramMap.get('claimId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => this.detail.set(detail));
  }
}
