import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor that automatically attaches JWT token to outgoing requests
 * and handles authentication errors globally
 * 
 * Uses modern functional interceptor pattern (Angular 15+)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clone request and add Authorization header if token exists and is valid
  let authReq = req;
  if (token && authService.hasValidToken()) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // Handle 401 Unauthorized errors globally
      if (error.status === 401 && authService.isAuthenticated()) {
        // Token is invalid or expired, log out the user
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'session-expired' }
        });
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        console.error('Access denied: Insufficient permissions');
      }

      return throwError(() => error);
    })
  );
};
