import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <section class="checkmate-card" [class.checkmate-card--interactive]="interactive">
      <ng-content />
    </section>
  `,
})
export class CardComponent {
  @Input() interactive = false;
}
