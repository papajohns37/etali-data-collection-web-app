import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { GlobalErrorHandler } from './core/error-handler';
import { httpErrorInterceptor } from './core/http-error.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { API_BASE_URL } from './core/tokens';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    MessageService,
    provideRouter(routes, withViewTransitions()), 
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'system',
          cssLayer: false
        }
      }
    }),
    provideHttpClient(withFetch(), withInterceptors([httpErrorInterceptor, authInterceptor]))
  ]
};
