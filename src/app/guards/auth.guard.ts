import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/**
 * Route guard that requires user authentication
 * Redirects to login page if user is not authenticated
 * 
 * Uses modern functional guard pattern (Angular 15+)
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken()) {
    return true;
  }

  // Redirect to login with return URL to redirect back after login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};

/**
 * Route guard that requires admin role
 * Redirects to home if user doesn't have admin privileges
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken() && authService.isAdmin()) {
    return true;
  }

  // Redirect to home page if not an admin
  router.navigate(['/']);
  return false;
};

/**
 * Route guard that requires contributor or admin role
 * Redirects to home if user doesn't have contributor privileges
 */
export const contributorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidToken() && 
      (authService.hasRole(UserRole.Contributor) || authService.isAdmin())) {
    return true;
  }

  // Redirect to home page if not a contributor or admin
  router.navigate(['/']);
  return false;
};
