import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { appConfigProviders } from './app/app.config';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [...appConfigProviders, provideRouter(routes), provideAnimations()]
}).catch(err => console.error(err));
