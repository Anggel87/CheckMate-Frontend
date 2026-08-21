import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DialogService } from '../../../../shared/feedback/services/dialog.service';
import { ToastService } from '../../../../shared/feedback/services/toast.service';
import { apiErrorMessage } from '../../../../shared/utils/api-error.util';
import { NFC_ROLE_LABELS, NfcCardUserView, NfcCardsApiService } from '../../data-access/nfc-cards-api.service';

@Component({
  selector: 'app-nfc-cards-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, EmptyStateComponent, LoadingSpinnerComponent, StatusBadgeComponent],
  template: `
    <section class="management-page">
      <app-page-header
        title="Tarjetas NFC"
        description="Asigna un UID de tarjeta NFC personalizado a cualquier usuario para que pueda usarla al checar asistencia o abrir su sesion de clase."
      />

      <div class="checkmate-card" style="padding: 1rem; margin-bottom: 1rem; display: flex; gap: .75rem; flex-wrap: wrap;">
        <input
          type="search"
          placeholder="Buscar por nombre o correo..."
          [ngModel]="searchTerm()"
          (ngModelChange)="searchTerm.set($event)"
          style="flex: 1; min-width: 220px;"
        />
        <select [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
          <option value="">Todos los roles</option>
          @for (role of roleOptions; track role) {
            <option [value]="role">{{ roleLabel(role) }}</option>
          }
        </select>
      </div>

      @if (loading()) {
        <app-loading-spinner label="Cargando usuarios..." [showLabel]="true" />
      } @else if (filteredUsers().length === 0) {
        <app-empty-state
          icon="fa-solid fa-id-card"
          title="Sin resultados"
          description="No hay usuarios que coincidan con la busqueda."
        />
      } @else {
        <div class="checkmate-card management-table-card">
          <div class="management-table-wrap">
            <table class="management-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Tarjeta NFC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr>
                    <td>{{ user.fullName }}</td>
                    <td>{{ user.email }}</td>
                    <td><app-status-badge [label]="user.roleLabel" tone="info" /></td>
                    <td>
                      @if (editingUserId() === user.id) {
                        <input
                          type="text"
                          [ngModel]="editingUid()"
                          (ngModelChange)="editingUid.set($event)"
                          placeholder="UID de la tarjeta"
                          style="width: 100%;"
                        />
                      } @else {
                        {{ user.nfcUid ?? 'Sin tarjeta' }}
                      }
                    </td>
                    <td>
                      @if (editingUserId() === user.id) {
                        <button
                          type="button"
                          class="btn-checkmate btn-checkmate-primary"
                          [disabled]="saving()"
                          (click)="saveEdit(user)"
                        >
                          Guardar
                        </button>
                        <button type="button" class="btn-checkmate btn-checkmate-secondary" [disabled]="saving()" (click)="cancelEdit()">
                          Cancelar
                        </button>
                      } @else {
                        <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="startEdit(user)">
                          {{ user.nfcUid ? 'Editar' : 'Asignar' }}
                        </button>
                        @if (user.nfcUid) {
                          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="clearCard(user)">
                            Quitar
                          </button>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </section>
  `,
})
export class NfcCardsListComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly nfcCardsApi = inject(NfcCardsApiService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  protected readonly roleOptions = Object.keys(NFC_ROLE_LABELS);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly users = signal<NfcCardUserView[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly roleFilter = signal('');
  protected readonly editingUserId = signal<string | null>(null);
  protected readonly editingUid = signal('');

  protected readonly filteredUsers = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();

    return this.users().filter((user) => {
      const matchesRole = !role || user.role === role;
      const matchesSearch =
        !search || user.fullName.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  });

  constructor() {
    this.load();
  }

  protected roleLabel(role: string): string {
    return NFC_ROLE_LABELS[role] ?? role;
  }

  protected startEdit(user: NfcCardUserView): void {
    this.editingUserId.set(user.id);
    this.editingUid.set(user.nfcUid ?? '');
  }

  protected cancelEdit(): void {
    this.editingUserId.set(null);
    this.editingUid.set('');
  }

  protected saveEdit(user: NfcCardUserView): void {
    const nfcUid = this.editingUid().trim();

    if (!nfcUid) {
      this.toastService.error('UID requerido', 'Ingresa el UID de la tarjeta.');
      return;
    }

    this.saving.set(true);
    this.nfcCardsApi
      .assignCard(user.id, nfcUid)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.replaceUser(updated);
          this.cancelEdit();
          this.toastService.success('Tarjeta asignada', `Se asigno la tarjeta a ${updated.fullName}.`);
        },
        error: (error) =>
          this.toastService.error('No se pudo asignar la tarjeta', apiErrorMessage(error, 'Intenta nuevamente.')),
      });
  }

  protected async clearCard(user: NfcCardUserView): Promise<void> {
    const confirmed = await this.dialogService.confirm({
      title: 'Quitar tarjeta NFC?',
      message: `Se quitara la tarjeta asignada a ${user.fullName}. Podras asignarle otra despues.`,
      confirmText: 'Quitar',
      cancelText: 'Cancelar',
      variant: 'danger',
      icon: 'fa-solid fa-id-card',
    });

    if (!confirmed) {
      return;
    }

    this.nfcCardsApi
      .clearCard(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceUser(updated);
          this.toastService.success('Tarjeta removida', `Se quito la tarjeta de ${updated.fullName}.`);
        },
        error: (error) =>
          this.toastService.error('No se pudo quitar la tarjeta', apiErrorMessage(error, 'Intenta nuevamente.')),
      });
  }

  private replaceUser(updated: NfcCardUserView): void {
    this.users.update((users) => users.map((user) => (user.id === updated.id ? updated : user)));
  }

  private load(): void {
    this.loading.set(true);
    this.nfcCardsApi
      .getUsers()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => this.users.set(users));
  }
}
