import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../../core/authorization/permission.service';
import { UserRole } from '../../core/enums/user-role.enum';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);
  private rendered = false;

  @Input() set appHasRole(roles: UserRole[]) {
    const allowed = this.permissionService.hasRole(roles);

    if (allowed && !this.rendered) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainerRef.clear();
      this.rendered = false;
    }
  }
}
