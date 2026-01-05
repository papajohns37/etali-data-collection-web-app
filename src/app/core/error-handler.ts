import { ErrorHandler, Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Global error handler that catches unhandled exceptions
 * and provides user-friendly feedback
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private messageService = inject(MessageService);

  handleError(error: Error): void {
    console.error('Unhandled error:', error);

    // Show user-friendly error message
    this.messageService.add({
      severity: 'error',
      summary: 'An Error Occurred',
      detail: 'Something went wrong. Please try again or contact support if the problem persists.',
      life: 5000,
    });

    // In production, you would send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }
}
