import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/user.model';

export function permissionGuard(...required: Permission[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/auth/login']);
    }
    if (required.length === 0 || auth.hasAnyPermission(...required)) {
      return true;
    }
    return router.createUrlTree(['/dashboard/home']);
  };
}
