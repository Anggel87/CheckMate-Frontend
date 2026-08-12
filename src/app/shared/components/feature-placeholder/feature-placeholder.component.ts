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
      title="Próximamente"
      description="Esta sección estará disponible en una futura actualización."
    />
  `,
})
export class FeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = (this.route.snapshot.data['title'] as string | undefined) ?? 'Módulo';
  protected readonly description =
    (this.route.snapshot.data['description'] as string | undefined) ?? 'Disponible próximamente.';
}
