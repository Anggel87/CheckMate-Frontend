import { Pipe, PipeTransform } from '@angular/core';
import { UserRole, getUserRoleLabel } from '../../core/enums/user-role.enum';

@Pipe({
  name: 'roleName',
  standalone: true,
})
export class RoleNamePipe implements PipeTransform {
  transform(role: UserRole): string {
    return getUserRoleLabel(role);
  }
}
