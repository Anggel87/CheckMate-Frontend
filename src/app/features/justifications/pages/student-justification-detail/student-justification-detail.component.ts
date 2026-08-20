import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import {
  EMPTY_STUDENT_JUSTIFICATION_DETAIL,
  StudentJustificationDetailView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-justification-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="student-page">
      <a class="student-back-link" routerLink="/student/justifications">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Mis Justificantes
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando justificante..." [showLabel]="true" />
      } @else {
        <article class="student-card student-attendance-detail-card">
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

          @if (detail().rawStatus === 'PENDIENTE') {
            <footer class="student-detail-actions">
              <a
                class="btn-checkmate btn-checkmate-secondary"
                [routerLink]="['/student/justifications', detail().id, 'edit']"
              >
                <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                Editar justificante
              </a>
              <button
                type="button"
                class="btn-checkmate btn-checkmate-danger"
                [disabled]="deleting()"
                (click)="deleteJustification()"
              >
                <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                Eliminar justificante
              </button>
            </footer>
          }
        </article>
      }
    </section>
  `,
})
export class StudentJustificationDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentApi = inject(StudentPortalApiService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly detail = signal<StudentJustificationDetailView>(EMPTY_STUDENT_JUSTIFICATION_DETAIL);

  constructor() {
    this.studentApi
      .getJustificationDetail(this.route.snapshot.paramMap.get('justificationId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => this.detail.set(detail));
  }

  protected async deleteJustification(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Eliminar justificante?',
      message: 'Este justificante se eliminara y ya no se le dara seguimiento.',
      confirmText: 'Eliminar justificante',
      cancelText: 'Volver',
      variant: 'danger',
      icon: 'fa-regular fa-trash-can',
    });

    if (!confirmed) {
      return;
    }

    this.deleting.set(true);
    this.studentApi
      .deleteJustification(this.detail().id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Justificante eliminado', 'Tu justificante fue eliminado correctamente.');
          void this.router.navigateByUrl('/student/justifications');
        },
        error: (error) => {
          this.toastService.error(
            'No se pudo eliminar',
            apiErrorMessage(error, 'Es posible que ya haya sido revisado. Intenta recargar la pagina.'),
          );
        },
      });
  }
}
