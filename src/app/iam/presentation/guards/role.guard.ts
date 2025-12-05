import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../application/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/iam/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'] as Array<string>;
  const userRole = authService.getUserRole();

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Normalize roles to lowercase for comparison if needed, assuming backend sends consistent casing
  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  // Redirect to unauthorized page or home
  console.warn(`Unauthorized access attempt. User role: ${userRole}, Required: ${requiredRoles}`);
  router.navigate(['/']); 
  return false;
};
