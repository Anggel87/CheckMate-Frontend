import { Component, Input } from '@angular/core';
import { LandingBenefit } from '../../models/landing-content.model';

@Component({
  selector: 'app-landing-benefits',
  standalone: true,
  templateUrl: './landing-benefits.component.html',
  styleUrl: './landing-benefits.component.css',
})
export class LandingBenefitsComponent {
  @Input({ required: true }) benefits: LandingBenefit[] = [];
}
