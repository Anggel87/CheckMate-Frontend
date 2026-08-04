import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-feature-placeholder',
  standalone: true,
  imports: [EmptyStateComponent, PageHeaderComponent],
  template: `
    <app-page-header [title]="title" [description]="description" />

    <app-empty-state
      icon="fa-solid fa-screwdriver-wrench"
      title="Módulo en preparación"
      description="Esta sección se conectará con la API de CheckMate en una etapa posterior."
    />
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Módulo';
  protected readonly description =
    (this.route.snapshot.data['description'] as string | undefined) ??
    'Base funcional preparada para integrarse con la API.';
}
