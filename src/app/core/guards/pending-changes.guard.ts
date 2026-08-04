import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DialogService } from '../../shared/feedback/services/dialog.service';

export interface PendingChangesAware {
  hasPendingChanges: () => boolean;
}

export const pendingChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) => {
  if (!component.hasPendingChanges()) {
    return true;
  }

  const dialogService = inject(DialogService);

  return dialogService.confirm({
    title: 'Salir sin guardar',
    message: 'Tienes cambios pendientes. Si sales ahora, se perderá la información capturada.',
    icon: 'fa-solid fa-triangle-exclamation',
    confirmText: 'Salir',
    cancelText: 'Cancelar',
    variant: 'warning',
  });
};
