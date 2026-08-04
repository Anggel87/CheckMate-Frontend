import { DialogVariant } from './dialog.model';

export interface DoubleConfirmationDialogOptions {
  title: string;
  message: string;
  warning: string;
  confirmationTitle: string;
  confirmationMessage: string;
  requiredText: string;
  icon?: string;
  continueText?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  allowEscapeClose?: boolean;
}

export interface DoubleConfirmationDialogConfig extends DoubleConfirmationDialogOptions {
  kind: 'double-confirmation';
  icon: string;
  continueText: string;
  confirmText: string;
  cancelText: string;
  variant: DialogVariant;
  allowEscapeClose: boolean;
}

export type DialogConfig = ConfirmationDialogConfig | DoubleConfirmationDialogConfig;
