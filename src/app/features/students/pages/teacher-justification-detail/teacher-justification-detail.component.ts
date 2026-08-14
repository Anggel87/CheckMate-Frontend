import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import {
  EMPTY_TEACHER_JUSTIFICATION_DETAIL,
  TeacherJustificationDetailView,
  TeacherPortalApiService,
} from '../../../teacher-portal/data-access/teacher-portal-api.service';

@Component({
  selector: 'app-teacher-justification-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="teacher-page">
      <a class="student-back-link" [routerLink]="backRoute()">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Justificantes
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando justificante..." [showLabel]="true" />
      } @else {
        <article class="teacher-card student-attendance-detail-card">
          <header>
            <div>
              <h1>{{ detail().subject || 'Justificante' }}</h1>
              <p>{{ detail().date }}</p>
            </div>
            <app-status-badge [label]="detail().status || 'Sin estado'" [tone]="detail().statusTone" />
          </header>

          <dl class="student-detail-list">
            <div>
              <dt>Motivo</dt>
              <dd>{{ detail().reason }}</dd>
            </div>
            @if (detail().reviewedBy) {
              <div>
                <dt>Revisado por</dt>
                <dd>{{ detail().reviewedBy }}</dd>
              </div>
            }
            @if (detail().comment) {
              <div>
                <dt>Comentario</dt>
                <dd>{{ detail().comment }}</dd>
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
export class TeacherJustificationDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly teacherApi = inject(TeacherPortalApiService);

  protected readonly loading = signal(true);
  protected readonly detail = signal<TeacherJustificationDetailView>(EMPTY_TEACHER_JUSTIFICATION_DETAIL);

  constructor() {
    this.teacherApi
      .getJustificationDetail(this.route.snapshot.paramMap.get('justificationId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => this.detail.set(detail));
  }

  protected backRoute(): string[] {
    const studentId = this.route.snapshot.paramMap.get('studentId');
    return studentId ? ['/teacher/students', studentId, 'justifications'] : ['/teacher/groups'];
  }
}
