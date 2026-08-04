import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../../core/authorization/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private rendered = false;

  @Input() set appHasPermission(permission: string) {
    const allowed = this.permissionService.hasPermission(permission);

    if (allowed && !this.rendered) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainerRef.clear();
      this.rendered = false;
    }
  }
}
