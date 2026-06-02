import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const allowedRoles: Role[] = route.data['roles'] ?? [];

  const user = auth.getCurrentUser();
  if (user && (allowedRoles.length === 0 || allowedRoles.includes(user.role))) {
    return true;
  }

  return router.createUrlTree(['/dashboard/home']);
};
