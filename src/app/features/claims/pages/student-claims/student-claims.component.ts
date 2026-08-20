import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import {
  StudentClaimView,
  StudentPortalApiService,
} from '../../../student-portal/data-access/student-portal-api.service';

@Component({
  selector: 'app-student-claims',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, LoadingSpinnerComponent],
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

      @if (loading()) {
        <app-loading-spinner label="Cargando reclamos..." [showLabel]="true" />
      } @else {
        <section class="student-claims-summary">
          <article class="student-card student-total-card">
            <span>Total Reclamos</span>
            <strong>{{ claims().length }} <small>registrados</small></strong>
            <i class="fa-regular fa-clipboard" aria-hidden="true"></i>
          </article>

          <article class="student-card student-status-summary">
            <span>Estado Actual</span>
            <div>
              <strong
                ><i class="student-dot student-dot--late"></i>{{ pendingCount() }} <small>Pendientes</small></strong
              >
              <strong
                ><i class="student-dot student-dot--justified"></i>{{ reviewCount() }}
                <small>En revision</small></strong
              >
              <strong
                ><i class="student-dot student-dot--present"></i>{{ approvedCount() }} <small>Aprobados</small></strong
              >
            </div>
          </article>
        </section>

        <article class="student-card student-table-card">
          <header class="student-table-header">
            <h2>Historial de Reclamos</h2>
            <div class="student-table-filters">
              <label class="student-filter-control">
                <span class="sr-only">Filtrar por fecha</span>
                <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
                <input
                  class="checkmate-input"
                  type="date"
                  [value]="dateFilter()"
                  (change)="dateFilter.set(inputValue($event))"
                />
              </label>
              <label class="student-filter-control">
                <span class="sr-only">Filtrar por estado</span>
                <i class="fa-solid fa-list-check" aria-hidden="true"></i>
                <select
                  class="checkmate-select"
                  [value]="statusFilter()"
                  (change)="statusFilter.set(inputValue($event))"
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="info">En revision</option>
                  <option value="success">Aprobados</option>
                  <option value="danger">Rechazados</option>
                </select>
              </label>
              @if (dateFilter() || statusFilter()) {
                <button
                  type="button"
                  class="btn-checkmate btn-checkmate-secondary"
                  (click)="clearFilters()"
                >
                  <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                  Limpiar
                </button>
              }
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
                @for (claim of filteredClaims(); track claim.id) {
                  <tr>
                    <td>{{ claim.date }}</td>
                    <td>
                      <strong>{{ claim.title }}</strong>
                      <small>{{ claim.description }}</small>
                    </td>
                    <td><app-status-badge [label]="claim.status" [tone]="claim.statusTone" /></td>
                    <td>
                      <a
                        class="student-icon-button"
                        [routerLink]="['/student/claims', claim.id]"
                        [attr.aria-label]="'Ver ' + claim.title"
                      >
                        <i class="fa-regular fa-eye" aria-hidden="true"></i>
                      </a>
                      @if (claim.rawStatus === 'PENDIENTE') {
                        <a
                          class="student-icon-button"
                          [routerLink]="['/student/claims', claim.id, 'edit']"
                          [attr.aria-label]="'Editar ' + claim.title"
                        >
                          <i class="fa-regular fa-pen-to-square" aria-hidden="true"></i>
                        </a>
                        <button
                          type="button"
                          class="student-icon-button"
                          [attr.aria-label]="'Cancelar ' + claim.title"
                          [disabled]="deletingId() === claim.id"
                          (click)="cancelClaim(claim)"
                        >
                          <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="dropdown-empty">
                      @if (dateFilter() || statusFilter()) {
                        Ningun reclamo coincide con los filtros aplicados.
                      } @else {
                        Aun no tienes reclamos registrados.
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <footer class="student-table-footer">
            <span>Mostrando {{ filteredClaims().length }} reclamos</span>
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
      }
    </section>
  `,
})
export class StudentClaimsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly studentApi = inject(StudentPortalApiService);
  private readonly dialogService = inject(DialogService);
  private readonly toastService = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly claims = signal<StudentClaimView[]>([]);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly dateFilter = signal('');
  protected readonly statusFilter = signal('');

  protected readonly filteredClaims = computed(() => {
    const date = this.dateFilter();
    const status = this.statusFilter();

    return this.claims().filter((claim) => {
      const matchesDate = !date || this.toIsoDate(claim.rawDate) === date;
      const matchesStatus = !status || claim.statusTone === status;
      return matchesDate && matchesStatus;
    });
  });

  constructor() {
    this.studentApi
      .getClaims()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((claims) => {
        this.claims.set(claims);
      });
  }

  protected pendingCount(): number {
    return this.claims().filter((claim) => claim.statusTone === 'pending').length;
  }

  protected reviewCount(): number {
    return this.claims().filter((claim) => claim.statusTone === 'info').length;
  }

  protected approvedCount(): number {
    return this.claims().filter((claim) => claim.statusTone === 'success').length;
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected clearFilters(): void {
    this.dateFilter.set('');
    this.statusFilter.set('');
  }

  private toIsoDate(value: string): string {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
  }

  protected async cancelClaim(claim: StudentClaimView): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Cancelar reclamo?',
      message: `"${claim.title}" se eliminara y ya no se le dara seguimiento.`,
      confirmText: 'Cancelar reclamo',
      cancelText: 'Volver',
      variant: 'danger',
      icon: 'fa-regular fa-trash-can',
    });

    if (!confirmed) {
      return;
    }

    this.deletingId.set(claim.id);
    this.studentApi
      .deleteClaim(claim.id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success('Reclamo cancelado', 'Tu reclamo fue eliminado correctamente.');
          this.claims.update((current) => current.filter((item) => item.id !== claim.id));
        },
        error: (error) => {
          this.toastService.error(
            'No se pudo cancelar',
            apiErrorMessage(error, 'Es posible que ya este siendo atendido. Intenta recargar la pagina.'),
          );
        },
      });
  }
}
