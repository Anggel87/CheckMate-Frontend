import { Component, Input } from '@angular/core';
import { LandingFeature } from '../../models/landing-content.model';
import { LandingFeatureCardComponent } from '../landing-feature-card/landing-feature-card.component';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [LandingFeatureCardComponent],
  templateUrl: './landing-features.component.html',
  styleUrl: './landing-features.component.css',
})
export class LandingFeaturesComponent {
  @Input({ required: true }) features: LandingFeature[] = [];
}
