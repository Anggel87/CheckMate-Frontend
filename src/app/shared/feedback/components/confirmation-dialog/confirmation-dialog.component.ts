import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { DIALOG_VARIANT_CONFIG } from '../../constants/feedback-config.constants';
import { ConfirmationDialogConfig } from '../../models/confirmation-dialog.model';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  template: `
    <section
      #dialogPanel
      class="checkmate-dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      [attr.aria-describedby]="descriptionId"
      tabindex="-1"
    >
      <button
        type="button"
        class="checkmate-dialog__close"
        aria-label="Cerrar modal"
        (click)="closed.emit(false)"
      >
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <span class="checkmate-dialog__icon" [class]="variantToneClass()" aria-hidden="true">
        <i [class]="config.icon"></i>
      </span>

      <h2 [id]="titleId">{{ config.title }}</h2>
      <p [id]="descriptionId">{{ config.message }}</p>

      <div class="checkmate-dialog__actions">
        <button
          type="button"
          class="btn-checkmate btn-checkmate-secondary"
          (click)="closed.emit(false)"
        >
          {{ config.cancelText }}
        </button>
        <button
          type="button"
          class="btn-checkmate"
          [class]="confirmButtonClass()"
          (click)="closed.emit(true)"
        >
          {{ config.confirmText }}
        </button>
      </div>
    </section>
  `,
})
export class ConfirmationDialogComponent implements AfterViewInit {
  @Input({ required: true }) config!: ConfirmationDialogConfig;
  @Output() readonly closed = new EventEmitter<boolean>();
  @ViewChild('dialogPanel') private readonly dialogPanel?: ElementRef<HTMLElement>;

  readonly titleId = `dialog-title-${Math.random().toString(36).slice(2)}`;
  readonly descriptionId = `dialog-description-${Math.random().toString(36).slice(2)}`;

  ngAfterViewInit(): void {
    window.setTimeout(() => this.dialogPanel?.nativeElement.focus(), 0);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.config.allowEscapeClose) {
      this.closed.emit(false);
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  trapFocus(event: Event): void {
    this.keepFocusInside(event as KeyboardEvent);
  }

  variantToneClass(): string {
    return DIALOG_VARIANT_CONFIG[this.config.variant].toneClass;
  }

  confirmButtonClass(): string {
    return DIALOG_VARIANT_CONFIG[this.config.variant].buttonClass;
  }

  private keepFocusInside(event: KeyboardEvent): void {
    const panel = this.dialogPanel?.nativeElement;

    if (!panel) {
      return;
    }

    const focusable = this.getFocusableElements(panel);

    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(panel: HTMLElement): HTMLElement[] {
    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }
}
