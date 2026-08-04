import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    window.setTimeout(() => this.elementRef.nativeElement.focus(), 0);
  }
}
