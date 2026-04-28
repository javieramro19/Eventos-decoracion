import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { clientGuard } from './core/auth/client.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'eventos',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/events-gallery/events-gallery.component').then(m => m.PublicEventsGalleryComponent),
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/public/event-detail/event-detail.component').then(m => m.PublicEventDetailComponent),
      },
    ],
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
    canActivate: [clientGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'events',
        loadComponent: () => import('./features/admin/events-list/admin-events-list.component').then(m => m.AdminEventsListComponent),
      },
      {
        path: 'events/new',
        loadComponent: () => import('./features/admin/events-form/admin-events-form.component').then(m => m.AdminEventsFormComponent),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () => import('./features/admin/events-form/admin-events-form.component').then(m => m.AdminEventsFormComponent),
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/admin/contacts/admin-contacts.component').then(m => m.AdminContactsComponent),
      },
    ],
  },
  { path: 'events', pathMatch: 'full', redirectTo: 'admin/events' },
  { path: 'events/new', pathMatch: 'full', redirectTo: 'admin/events/new' },
  { path: 'events/:id/edit', redirectTo: 'admin/events/:id/edit' },
  { path: 'events/:id', redirectTo: 'admin/events/:id/edit' },
  { path: '**', redirectTo: '' },
];
