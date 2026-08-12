import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-claim-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-detail-actions">
        <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
          <a routerLink="/tutor/claims">Claims management</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <strong>Detalle de reclamacion - {{ claim().studentName }} {{ claim().group }}</strong>
        </nav>
        <div>
          <app-status-badge [label]="claim().priority" tone="danger" />
          <app-status-badge [label]="'ID: #' + claim().id" tone="neutral" />
        </div>
      </header>

      <div class="teacher-incident-detail-layout tutor-claim-detail-layout">
        <article class="teacher-card tutor-claim-description-card">
          <h2><i class="fa-solid fa-list" aria-hidden="true"></i> Descripcion del incidente</h2>
          <p>{{ claim().description }}</p>
        </article>

        <aside class="teacher-side-stack">
          <section class="teacher-card tutor-claim-evidence">
            <h2><i class="fa-solid fa-paperclip" aria-hidden="true"></i> Evidencia</h2>
            <div class="tutor-evidence-preview" aria-hidden="true">
              <i class="fa-regular fa-file-lines"></i>
              <span>Reclamaciones</span>
            </div>
            <p>{{ claim().evidenceLabel }}</p>
          </section>

          <section class="teacher-card tutor-recurrent-card">
            <span class="avatar">{{ claim().studentName.slice(0, 2).toUpperCase() }}</span>
            <div>
              <strong>{{ claim().studentName }}</strong>
              <small>Grupo: {{ claim().group }} (Matutino)</small>
            </div>
          </section>
        </aside>

        <section class="teacher-card tutor-claim-meta">
          <article>
            <span>Fecha del incidente</span>
            <strong>{{ claim().incidentDate }}</strong>
          </article>
          <article>
            <span>Ubicacion especifica</span>
            <strong>{{ claim().location }}</strong>
          </article>
        </section>

        <section class="teacher-card tutor-claim-actions">
          <button type="button" class="btn-checkmate btn-checkmate-danger" [disabled]="saving()" (click)="reject()">
            <i class="fa-solid fa-ban" aria-hidden="true"></i>
            Rechazar
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-success" [disabled]="saving()" (click)="startFollowUp()">
            <i class="fa-solid fa-code-branch" aria-hidden="true"></i>
            Seguimiento
          </button>
          <a class="btn-checkmate btn-checkmate-warning" [href]="'mailto:tutorias@checkmate.edu.mx?subject=' + claim().id">
            <i class="fa-regular fa-message" aria-hidden="true"></i>
            Contactar
          </a>
          <button type="button" class="btn-checkmate btn-checkmate-primary" [disabled]="saving()" (click)="closeClaim()">
            <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
            Concluir reclamacion
          </button>
        </section>

        <section class="tutor-claim-timeline">
          <h2>Historial de la reclamacion</h2>
          @for (item of claim().timeline; track item.title) {
            <article>
              <span></span>
              <div>
                <strong>{{ item.title }}</strong>
                <small>{{ item.date }}</small>
                <p>{{ item.description }}</p>
              </div>
            </article>
          }
        </section>
      </div>
    </section>
  `,
})
export class TutorClaimDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tutoringData = inject(TutoringDataService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly claim = computed(() =>
    this.tutoringData.claimById(this.route.snapshot.paramMap.get('claimId')),
  );

  protected async reject(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Rechazar reclamacion?',
      message: 'El reclamo se marcara como rechazado y dejara de aparecer como activo.',
      confirmText: 'Rechazar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-ban',
    });

    if (confirmed) {
      this.updateStatus('Rechazado');
    }
  }

  protected async startFollowUp(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Iniciar seguimiento?',
      message: 'El reclamo quedara marcado como en proceso.',
      confirmText: 'Iniciar',
      cancelText: 'Cancelar',
      variant: 'info',
      icon: 'fa-solid fa-code-branch',
    });

    if (confirmed) {
      this.updateStatus('En proceso');
    }
  }

  protected async closeClaim(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Concluir reclamacion?',
      message: 'El reclamo se marcara como resuelto para este alumno.',
      confirmText: 'Concluir',
      cancelText: 'Cancelar',
      variant: 'success',
      icon: 'fa-regular fa-circle-check',
    });

    if (confirmed) {
      this.updateStatus('Aprobado');
    }
  }

  private updateStatus(status: 'Aprobado' | 'Rechazado' | 'En proceso'): void {
    this.saving.set(true);
    this.tutoringData
      .updateClaimStatus(this.claim().id, status)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          if (updated) {
            this.toastService.success('Reclamacion actualizada', `Estado: ${status}.`);
            return;
          }

          this.toastService.error('No se pudo actualizar', 'No hay reclamo valido para enviar.');
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error(
            'No se pudo actualizar',
            apiErrorMessage(error, 'No se pudo actualizar el reclamo. Intenta nuevamente.'),
          );
        },
      });
  }
}
