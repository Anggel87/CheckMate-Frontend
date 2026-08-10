import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { TutoringDataService } from '../../../tutoring/data-access/tutoring-data.service';

@Component({
  selector: 'app-tutor-justification-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent],
  template: `
    <section class="teacher-page">
      <header class="teacher-detail-actions">
        <nav class="teacher-profile-route" aria-label="Ruta de navegacion">
          <a routerLink="/tutor/justifications">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            Justificantes
          </a>
          <span>/</span>
          <strong>{{ justification().id }}</strong>
        </nav>

        <div>
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="downloadPdf()">
            Generar PDF
          </button>
        </div>
      </header>

      <div class="teacher-incident-detail-layout tutor-justification-detail-layout">
        <article class="teacher-card tutor-justification-document">
          <header>
            <div>
              <span>ID: {{ justification().id }}</span>
              <h1>{{ justification().title }}</h1>
            </div>
            <app-status-badge [label]="justification().status" [tone]="justification().statusTone" />
          </header>

          <section class="teacher-report-grid" aria-label="Datos del justificante">
            <div>
              <span>Alumno</span>
              <strong>{{ justification().studentName }} - {{ justification().group }}</strong>
            </div>
            <div>
              <span>Materia</span>
              <strong>{{ justification().subject }}</strong>
            </div>
            <div>
              <span>Profesor</span>
              <strong>{{ justification().teacher }}</strong>
            </div>
            <div>
              <span>Fecha de ausencia</span>
              <strong>{{ justification().absenceDate }}</strong>
            </div>
            <div>
              <span>Tipo</span>
              <strong>{{ justification().type }}</strong>
            </div>
            <div>
              <span>Fecha de envio</span>
              <strong>{{ justification().sentDate }}</strong>
            </div>
          </section>

          <section class="teacher-report-section">
            <h2>Motivo detallado</h2>
            <p>{{ justification().detail }}</p>
          </section>

          <section class="tutor-attachment-section">
            <h2>Archivos adjuntos ({{ justification().attachments.length }})</h2>
            <div class="tutor-attachment-grid">
              @for (file of justification().attachments; track file.name) {
                <button type="button" class="tutor-attachment-card" (click)="downloadAttachment(file.name)">
                  <i [class]="file.icon" aria-hidden="true"></i>
                  <span>
                    <strong>{{ file.name }}</strong>
                    <small>{{ file.size }}</small>
                  </span>
                  <i class="fa-solid fa-download" aria-hidden="true"></i>
                </button>
              }
            </div>
          </section>

          <section class="tutor-resolution-box">
            <label class="teacher-form-field" for="justification-resolution-note">
              <span class="checkmate-label">Nota de resolucion</span>
              <textarea
                id="justification-resolution-note"
                class="checkmate-textarea"
                placeholder="Agrega una observacion para el alumno o profesor..."
                (input)="resolutionNote.set(inputValue($event))"
              ></textarea>
            </label>
            <div class="teacher-filter-actions">
              <button
                type="button"
                class="btn-checkmate btn-checkmate-success"
                [disabled]="resolving() || justification().status === 'Aprobado'"
                (click)="approve()"
              >
                Aprobar justificante
              </button>
              <button
                type="button"
                class="btn-checkmate btn-checkmate-danger"
                [disabled]="resolving() || justification().status === 'Rechazado'"
                (click)="reject()"
              >
                Rechazar
              </button>
            </div>
          </section>
        </article>

        <aside class="teacher-side-stack">
          <section class="teacher-card tutor-observations-card">
            <h2><i class="fa-regular fa-message" aria-hidden="true"></i> Observaciones</h2>
            @if (justification().observations.length === 0) {
              <p class="dropdown-empty">Sin observaciones registradas.</p>
            } @else {
              @for (observation of justification().observations; track observation.date) {
                <article class="tutor-observation">
                  <span class="avatar">{{ observation.author.slice(0, 2).toUpperCase() }}</span>
                  <div>
                    <strong>{{ observation.author }}</strong>
                    <small>{{ observation.role }} - {{ observation.date }}</small>
                    <p>{{ observation.message }}</p>
                  </div>
                </article>
              }
            }
          </section>
        </aside>
      </div>
    </section>
  `,
})
export class TutorJustificationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tutoringData = inject(TutoringDataService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly resolving = signal(false);
  protected readonly resolutionNote = signal('');
  protected readonly justification = computed(() =>
    this.tutoringData.justificationById(this.route.snapshot.paramMap.get('justificationId')),
  );

  protected async approve(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Aceptar justificante?',
      message: 'La asistencia seleccionada sera marcada como justificada.',
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
      variant: 'success',
      icon: 'fa-regular fa-circle-check',
    });

    if (!confirmed) {
      return;
    }

    this.resolveAs('Aprobado');
  }

  protected async reject(): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Rechazar justificante?',
      message:
        this.resolutionNote().trim().length > 0
          ? 'Se registrara el motivo capturado en la nota de resolucion.'
          : 'La solicitud sera rechazada sin una nota adicional.',
      confirmText: 'Rechazar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-regular fa-circle-xmark',
    });

    if (!confirmed) {
      return;
    }

    this.resolveAs('Rechazado');
  }

  protected downloadPdf(): void {
    this.toastService.info('PDF preparado', 'El reporte del justificante esta listo para descargar.');
  }

  protected downloadAttachment(fileName: string): void {
    this.toastService.info('Descarga iniciada', `Preparando ${fileName}.`);
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  private resolveAs(status: 'Aprobado' | 'Rechazado'): void {
    this.resolving.set(true);
    this.tutoringData
      .updateJustificationStatus(this.justification().id, status, this.resolutionNote())
      .pipe(
        finalize(() => this.resolving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          if (updated) {
            this.toastService.success('Justificante actualizado', `Estado: ${status}.`);
            return;
          }

          this.toastService.error('No se pudo actualizar', 'No hay justificante valido para enviar.');
        },
        error: () => {
          this.toastService.error('No se pudo actualizar', 'La API rechazo la revision del justificante.');
        },
      });
  }
}
