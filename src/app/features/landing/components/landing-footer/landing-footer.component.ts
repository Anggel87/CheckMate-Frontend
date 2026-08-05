import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.css',
})
export class LandingFooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
