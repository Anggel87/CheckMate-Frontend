import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { AuthService } from '../../../../core/authentication/auth.service';
import { UserRole } from '../../../../core/enums/user-role.enum';
import {
  EMPTY_SENT_NOTIFICATION_DETAIL,
  NotificationsApiService,
  SentNotificationDetailView,
  notificationTypeLabel,
} from '../../data-access/notifications-api.service';

@Component({
  selector: 'app-notification-sent-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <section class="management-page">
      <a class="student-back-link" [routerLink]="['..']">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        Volver a Notificaciones
      </a>

      @if (loading()) {
        <app-loading-spinner label="Cargando notificacion..." [showLabel]="true" />
      } @else {
        <article class="checkmate-card student-attendance-detail-card">
          <header>
            <div>
              <h1>{{ detail().title }}</h1>
              <p>{{ detail().sentAtLabel }}</p>
            </div>
            <app-status-badge [label]="typeLabel(detail().type)" tone="info" />
          </header>

          <dl class="student-detail-list">
            <div>
              <dt>Mensaje</dt>
              <dd>{{ detail().message }}</dd>
            </div>
            <div>
              <dt>Destinatario</dt>
              <dd>
                {{ detail().recipientLabel }}
                @if (detail().recipientsCount > 1) {
                  &mdash; {{ detail().recipientsCount }} destinatarios
                } @else if (detail().recipientNames[0]) {
                  &mdash; {{ detail().recipientNames[0] }}
                }
              </dd>
            </div>
            @if (detail().recipientsCount > 1 && detail().recipientNames.length) {
              <div>
                <dt>Lista de destinatarios</dt>
                <dd>{{ detail().recipientNames.join(', ') }}</dd>
              </div>
            }
            <div>
              <dt>Enviado por</dt>
              <dd>{{ detail().sentByName }}</dd>
            </div>
          </dl>

          @if (isAdmin()) {
            <footer class="student-detail-actions">
              <button
                type="button"
                class="btn-checkmate btn-checkmate-secondary"
                [disabled]="resending()"
                (click)="resend()"
              >
                <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
                Reenviar al mismo destinatario
              </button>
            </footer>
          }
        </article>
      }
    </section>
  `,
})
export class NotificationSentDetailComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly notificationsApi = inject(NotificationsApiService);

  protected readonly loading = signal(true);
  protected readonly resending = signal(false);
  protected readonly detail = signal<SentNotificationDetailView>(EMPTY_SENT_NOTIFICATION_DETAIL);
  protected readonly isAdmin = computed(() => this.authService.currentUser()?.role === UserRole.ADMIN);

  constructor() {
    this.notificationsApi
      .getSentDetail(this.route.snapshot.paramMap.get('notificationId'))
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => this.detail.set(detail));
  }

  protected typeLabel(type: string): string {
    return notificationTypeLabel(type);
  }

  protected resend(): void {
    const id = this.detail().id;

    if (!id) {
      return;
    }

    this.resending.set(true);
    this.notificationsApi
      .resendNotification(id)
      .pipe(
        finalize(() => this.resending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.toastService.success('Notificacion reenviada', 'Se reenvio correctamente.'),
        error: (error) =>
          this.toastService.error('No se pudo reenviar', apiErrorMessage(error, 'Intenta nuevamente.')),
      });
  }
}
