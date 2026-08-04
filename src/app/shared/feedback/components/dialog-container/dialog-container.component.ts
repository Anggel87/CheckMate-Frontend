import { Component, inject } from '@angular/core';
import { ConfirmationDialogConfig } from '../../models/confirmation-dialog.model';
import { DialogConfig, DoubleConfirmationDialogConfig } from '../../models/double-confirmation-dialog.model';
import { DialogService } from '../../services/dialog.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DoubleConfirmationDialogComponent } from '../double-confirmation-dialog/double-confirmation-dialog.component';

@Component({
  selector: 'app-dialog-container',
  standalone: true,
  imports: [ConfirmationDialogComponent, DoubleConfirmationDialogComponent],
  template: `
    @if (dialogService.activeDialog(); as dialog) {
      <div class="checkmate-dialog-overlay">
        @if (dialog.kind === 'confirmation') {
          <app-confirmation-dialog
            [config]="asConfirmationDialog(dialog)"
            (closed)="dialogService.close($event)"
          />
        } @else {
          <app-double-confirmation-dialog
            [config]="asDoubleConfirmationDialog(dialog)"
            (closed)="dialogService.close($event)"
          />
        }
      </div>
    }
  `,
})
export class DialogContainerComponent {
  protected readonly dialogService = inject(DialogService);

  asConfirmationDialog(dialog: DialogConfig): ConfirmationDialogConfig {
    return dialog as ConfirmationDialogConfig;
  }

  asDoubleConfirmationDialog(dialog: DialogConfig): DoubleConfirmationDialogConfig {
    return dialog as DoubleConfirmationDialogConfig;
  }
}
