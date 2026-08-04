import { DialogVariant } from './dialog.model';

export interface ConfirmationDialogOptions {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  allowEscapeClose?: boolean;
}

export interface ConfirmationDialogConfig extends ConfirmationDialogOptions {
  kind: 'confirmation';
  icon: string;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
  allowEscapeClose: boolean;
}
