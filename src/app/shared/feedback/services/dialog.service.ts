import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { DIALOG_VARIANT_CONFIG } from '../constants/feedback-config.constants';
import { ConfirmationDialogConfig, ConfirmationDialogOptions } from '../models/confirmation-dialog.model';
import {
  DialogConfig,
  DoubleConfirmationDialogConfig,
  DoubleConfirmationDialogOptions,
} from '../models/double-confirmation-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly document = inject(DOCUMENT);
  private resolver: ((value: boolean) => void) | null = null;
  private previousFocus: HTMLElement | null = null;

  readonly activeDialog = signal<DialogConfig | null>(null);

  confirm(options: ConfirmationDialogOptions): Promise<boolean> {
    const variant = options.variant ?? 'default';
    const config: ConfirmationDialogConfig = {
      kind: 'confirmation',
      title: options.title,
      message: options.message,
      icon: options.icon ?? DIALOG_VARIANT_CONFIG[variant].icon,
      confirmText: options.confirmText ?? 'Confirmar',
      cancelText: options.cancelText ?? 'Cancelar',
      variant,
      allowEscapeClose: options.allowEscapeClose ?? true,
    };

    return this.open(config);
  }

  doubleConfirm(options: DoubleConfirmationDialogOptions): Promise<boolean> {
    const variant = options.variant ?? 'danger';
    const config: DoubleConfirmationDialogConfig = {
      kind: 'double-confirmation',
      title: options.title,
      message: options.message,
      warning: options.warning,
      confirmationTitle: options.confirmationTitle,
      confirmationMessage: options.confirmationMessage,
      requiredText: options.requiredText,
      icon: options.icon ?? DIALOG_VARIANT_CONFIG[variant].icon,
      continueText: options.continueText ?? 'Continuar',
      confirmText: options.confirmText ?? 'Confirmar',
      cancelText: options.cancelText ?? 'Cancelar',
      variant,
      allowEscapeClose: options.allowEscapeClose ?? false,
    };

    return this.open(config);
  }

  close(result: boolean): void {
    const resolver = this.resolver;
    this.resolver = null;
    this.activeDialog.set(null);
    resolver?.(result);
    this.restoreFocus();
  }

  private open(config: DialogConfig): Promise<boolean> {
    if (this.resolver) {
      this.close(false);
    }

    const activeElement = this.document.activeElement;
    this.previousFocus = activeElement instanceof HTMLElement ? activeElement : null;
    this.activeDialog.set(config);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  private restoreFocus(): void {
    window.setTimeout(() => this.previousFocus?.focus(), 0);
  }
}
