import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { DIALOG_VARIANT_CONFIG } from '../../constants/feedback-config.constants';
import { DoubleConfirmationDialogConfig } from '../../models/double-confirmation-dialog.model';

@Component({
  selector: 'app-double-confirmation-dialog',
  standalone: true,
  template: `
    <section
      #dialogPanel
      class="checkmate-dialog checkmate-dialog--double"
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
        (click)="cancel()"
      >
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      <div class="checkmate-dialog__steps" aria-label="Paso actual">
        <span [class.is-active]="step() === 1"></span>
        <span [class.is-active]="step() === 2"></span>
      </div>

      @if (step() === 1) {
        <span class="checkmate-dialog__icon" [class]="variantToneClass()" aria-hidden="true">
          <i [class]="config.icon"></i>
        </span>

        <h2 [id]="titleId">{{ config.title }}</h2>
        <p [id]="descriptionId">{{ config.message }}</p>
        <p class="checkmate-dialog__warning">{{ config.warning }}</p>

        <div class="checkmate-dialog__actions">
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancel()">
            {{ config.cancelText }}
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-primary" (click)="goToConfirmation()">
            {{ config.continueText }}
          </button>
        </div>
      } @else {
        <span class="checkmate-dialog__icon" [class]="variantToneClass()" aria-hidden="true">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
        </span>

        <h2 [id]="titleId">{{ config.confirmationTitle }}</h2>
        <p [id]="descriptionId">{{ config.confirmationMessage }}</p>

        <label class="checkmate-label checkmate-dialog__label" for="double-confirmation-input">
          Escribe: {{ config.requiredText }}
        </label>
        <input
          #confirmationInput
          id="double-confirmation-input"
          class="checkmate-input"
          [class.is-invalid]="confirmationText().length > 0 && !confirmationMatches()"
          type="text"
          autocomplete="off"
          [value]="confirmationText()"
          (input)="updateConfirmationText($event)"
        />

        <div class="checkmate-dialog__actions">
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="goBack()">
            Regresar
          </button>
          <button type="button" class="btn-checkmate btn-checkmate-secondary" (click)="cancel()">
            {{ config.cancelText }}
          </button>
          <button
            type="button"
            class="btn-checkmate"
            [class]="confirmButtonClass()"
            [disabled]="!confirmationMatches()"
            (click)="closed.emit(true)"
          >
            {{ config.confirmText }}
          </button>
        </div>
      }
    </section>
  `,
})
export class DoubleConfirmationDialogComponent implements AfterViewInit, OnChanges {
  @Input({ required: true }) config!: DoubleConfirmationDialogConfig;
  @Output() readonly closed = new EventEmitter<boolean>();
  @ViewChild('dialogPanel') private readonly dialogPanel?: ElementRef<HTMLElement>;
  @ViewChild('confirmationInput') private readonly confirmationInput?: ElementRef<HTMLInputElement>;

  readonly step = signal<1 | 2>(1);
  readonly confirmationText = signal('');
  readonly titleId = `double-dialog-title-${Math.random().toString(36).slice(2)}`;
  readonly descriptionId = `double-dialog-description-${Math.random().toString(36).slice(2)}`;

  ngOnChanges(): void {
    this.step.set(1);
    this.confirmationText.set('');
  }

  ngAfterViewInit(): void {
    window.setTimeout(() => this.dialogPanel?.nativeElement.focus(), 0);
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.config.allowEscapeClose) {
      this.cancel();
    }
  }

  @HostListener('document:keydown.tab', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    this.keepFocusInside(event);
  }

  goToConfirmation(): void {
    this.step.set(2);
    this.confirmationText.set('');
    window.setTimeout(() => this.confirmationInput?.nativeElement.focus(), 0);
  }

  goBack(): void {
    this.step.set(1);
    this.confirmationText.set('');
    window.setTimeout(() => this.dialogPanel?.nativeElement.focus(), 0);
  }

  cancel(): void {
    this.confirmationText.set('');
    this.closed.emit(false);
  }

  updateConfirmationText(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.confirmationText.set(input.value);
  }

  confirmationMatches(): boolean {
    return this.confirmationText().trim() === this.config.requiredText;
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

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );

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
}
