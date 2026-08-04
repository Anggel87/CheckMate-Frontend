import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appPreventDoubleClick]',
  standalone: true,
})
export class PreventDoubleClickDirective {
  @Input() appPreventDoubleClick = 700;
  private lastClick = 0;

  @HostListener('click', ['$event'])
  preventDuplicate(event: MouseEvent): void {
    const now = Date.now();

    if (now - this.lastClick < this.appPreventDoubleClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    this.lastClick = now;
  }
}
