import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { authInterceptorProvider } from './core/auth/auth.interceptor';

export const appConfigProviders = [
  provideHttpClient(withInterceptorsFromDi()),
  authInterceptorProvider,
];
