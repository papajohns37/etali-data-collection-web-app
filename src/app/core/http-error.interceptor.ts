import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { throwError, timer } from 'rxjs';
import { retry, catchError, timeout } from 'rxjs/operators';

/**
 * HTTP interceptor that handles errors, retries, and timeouts
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    // Add 30 second timeout
    timeout(30000),
    // Retry failed requests (only for GET requests)
    retry({
      count: 2,
      delay: (error, retryCount) => {
        // Only retry on network errors or 5xx server errors for GET requests
        if (
          req.method === 'GET' &&
          (error instanceof HttpErrorResponse && (error.status >= 500 || error.status === 0))
        ) {
          // Exponential backoff: 1s, 2s
          return timer(Math.min(1000 * Math.pow(2, retryCount - 1), 5000));
        }
        // Don't retry
        throw error;
      },
    }),
    // Handle errors
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
        // Client-side or network error (only in browser)
        errorMessage = `Network error: ${error.error.message}`;
      } else if (error.status === 0) {
        // Network error
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.status >= 500) {
        // Server error
        errorMessage = 'Server error. Please try again later.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied.';
      } else if (error.error?.error) {
        // API error message
        errorMessage = error.error.error;
      }

      // Show error toast (except for expected 404s that components handle)
      if (error.status !== 404 || !error.url?.includes('/statistics')) {
        messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }

      console.error('HTTP Error:', error);

      return throwError(() => error);
    })
  );
};
