import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FormValidationMessageComponent } from '../../../../shared/feedback/components/form-validation-message/form-validation-message.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { controlErrorMessage, markFormGroupTouched } from '../../../../shared/utils/form.utils';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-claim-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, ReactiveFormsModule, FormValidationMessageComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-detail-actions">
        <nav class="breadcrumbs teacher-uppercase-breadcrumb" aria-label="Ruta de navegacion">
          <a routerLink="/tutor/claims">Claims management</a>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          <strong>Detalle de reclamacion - {{ claim().studentName }} {{ claim().group }}</strong>
        </nav>
        <div>
          <app-status-badge [label]="claim().status" [tone]="claim().statusTone" />
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
            @if (claim().evidenceUrl) {
              <a class="btn-checkmate btn-checkmate-secondary" [href]="claim().evidenceUrl" target="_blank" rel="noopener">
                <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                Ver evidencia
              </a>
            } @else {
              <p class="dropdown-empty">Sin evidencia adjunta.</p>
            }
          </section>

          <section class="teacher-card tutor-recurrent-card">
            <span class="avatar">{{ claim().studentName.slice(0, 2).toUpperCase() }}</span>
            <div>
              <strong>{{ claim().studentName }}</strong>
              <small>Grupo: {{ claim().group }}</small>
            </div>
          </section>

          <section class="teacher-card teacher-student-tutors-card">
            <h2><i class="fa-solid fa-user-shield" aria-hidden="true"></i> Tutores Legales</h2>

            @if (student().tutors.length) {
              @for (tutor of student().tutors; track tutor.id) {
                <div class="management-tutor-row">
                  <div>
                    <strong>{{ tutor.fullName }}</strong>
                    <small>{{ tutor.relationship }}{{ tutor.isPrimary ? ' - Principal' : '' }}</small>
                  </div>
                  <span>{{ tutor.phone || 'Sin telefono' }}</span>
                </div>
              }
            } @else {
              <p class="dropdown-empty">Sin tutores legales registrados.</p>
            }

            <div class="tutor-legal-actions">
              <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="toggleMessage()">
                <i class="fa-regular fa-paper-plane" aria-hidden="true"></i>
                Notificar sobre este reclamo
              </button>
            </div>

            @if (sendingMessage()) {
              <form class="tutor-inline-form" [formGroup]="messageForm" (ngSubmit)="submitMessage()">
                <label class="teacher-form-field" for="message-title">
                  <span class="checkmate-label">Titulo del aviso</span>
                  <input id="message-title" class="checkmate-input" type="text" formControlName="title" />
                  <app-form-validation-message [message]="messageError('title', 'Titulo')" />
                </label>
                <label class="teacher-form-field" for="message-body">
                  <span class="checkmate-label">Mensaje</span>
                  <textarea id="message-body" class="checkmate-textarea" formControlName="message"></textarea>
                  <app-form-validation-message [message]="messageError('message', 'Mensaje')" />
                </label>
                <p class="teacher-help-note">
                  Se enviara por WhatsApp a los tutores del alumno que tengan notificaciones activas.
                </p>
                <footer class="student-form-actions">
                  <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="toggleMessage()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn-checkmate btn-checkmate-primary" [disabled]="sendingRequest()">
                    @if (sendingRequest()) {
                      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                      Enviando...
                    } @else {
                      Enviar
                    }
                  </button>
                </footer>
              </form>
            }
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

        @if (claim().lastAction; as lastAction) {
          <section class="teacher-card tutor-claim-last-action">
            <h2>Ultima actualizacion</h2>
            <p>
              <strong>{{ lastAction.by || 'Sistema' }}</strong>
              <span> - {{ lastAction.at }}</span>
            </p>
            @if (lastAction.comment) {
              <p class="teacher-help-note">{{ lastAction.comment }}</p>
            }
          </section>
        }

        <section class="teacher-card tutor-claim-actions">
          @if (isResolved()) {
            <p class="teacher-help-note">Este reclamo ya fue {{ claim().status === 'Aprobado' ? 'concluido' : 'rechazado' }}.</p>
          } @else {
            <button type="button" class="btn-checkmate btn-checkmate-danger" [disabled]="saving()" (click)="reject()">
              <i class="fa-solid fa-ban" aria-hidden="true"></i>
              Rechazar
            </button>
            @if (canFollowUp()) {
              <button type="button" class="btn-checkmate btn-checkmate-success" [disabled]="saving()" (click)="startFollowUp()">
                <i class="fa-solid fa-code-branch" aria-hidden="true"></i>
                Seguimiento
              </button>
            }
            <button type="button" class="btn-checkmate btn-checkmate-primary" [disabled]="saving()" (click)="closeClaim()">
              <i class="fa-regular fa-circle-check" aria-hidden="true"></i>
              Concluir reclamacion
            </button>
          }
        </section>
      </div>
    </section>
  `,
})
export class TutorClaimDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly tutoringData = inject(TutoringDataService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly sendingMessage = signal(false);
  protected readonly sendingRequest = signal(false);

  protected readonly claim = computed(() =>
    this.tutoringData.claimById(this.route.snapshot.paramMap.get('claimId')),
  );
  protected readonly student = computed(() => this.tutoringData.studentById(this.claim().studentId));
  protected readonly canFollowUp = computed(() => this.claim().status === 'Pendiente');
  protected readonly isResolved = computed(
    () => this.claim().status === 'Aprobado' || this.claim().status === 'Rechazado',
  );

  protected readonly messageForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(90)]],
    message: ['', [Validators.required, Validators.maxLength(350)]],
  });

  private loadedTutorsForStudentId: string | null = null;

  constructor() {
    effect(() => {
      const studentId = this.claim().studentId;

      if (studentId && studentId !== this.loadedTutorsForStudentId) {
        this.loadedTutorsForStudentId = studentId;
        this.tutoringData.loadStudentTutors(studentId);
      }
    });
  }

  protected toggleMessage(): void {
    this.messageForm.reset({ title: '', message: '' });
    this.sendingMessage.update((value) => !value);
  }

  protected messageError(control: keyof typeof this.messageForm.controls, label: string): string {
    return controlErrorMessage(this.messageForm.controls[control], label);
  }

  protected submitMessage(): void {
    markFormGroupTouched(this.messageForm);

    if (this.messageForm.invalid) {
      return;
    }

    const value = this.messageForm.getRawValue();

    this.sendingRequest.set(true);
    this.tutoringData
      .notifyTutors(this.student().id, value.title, value.message)
      .pipe(
        finalize(() => this.sendingRequest.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (recipientsCount) => {
          this.toastService.success('Mensaje enviado', `Se notifico a ${recipientsCount} tutor(es).`);
          this.sendingMessage.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.toastService.error('No se pudo enviar', apiErrorMessage(error, 'Intenta nuevamente.'));
        },
      });
  }

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
