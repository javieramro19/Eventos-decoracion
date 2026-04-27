import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
    ],
  },
  {
    path: 'plans/:id',
    loadComponent: () => import('./features/plans/plan-config/plan-config.component').then(m => m.PlanConfigComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'events',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/events/events-list/events-list.component').then(m => m.EventoListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./features/events/events-form/events-form.component').then(m => m.EventoFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/events/events-form/events-form.component').then(m => m.EventoFormComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/events/events-detail/events-detail.component').then(m => m.EventoDetailComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
