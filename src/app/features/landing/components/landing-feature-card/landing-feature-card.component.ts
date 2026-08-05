import { Component, Input } from '@angular/core';
import { LandingFeature } from '../../models/landing-content.model';

@Component({
  selector: 'app-landing-feature-card',
  standalone: true,
  templateUrl: './landing-feature-card.component.html',
  styleUrl: './landing-feature-card.component.css',
})
export class LandingFeatureCardComponent {
  @Input({ required: true }) feature!: LandingFeature;
}
