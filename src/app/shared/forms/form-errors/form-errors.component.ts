import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-errors',
  standalone: true,
  template: `
    @if (errors.length) {
      <section class="form-errors" role="alert" aria-label="Errores del formulario">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
        <div>
          <strong>{{ title }}</strong>
          <ul>
            @for (error of errors; track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class FormErrorsComponent {
  @Input() title = 'Revisa la información capturada';
  @Input() errors: string[] = [];
}
