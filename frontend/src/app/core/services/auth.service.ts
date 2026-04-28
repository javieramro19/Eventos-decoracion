import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
    }
  }

  register(data: { name: string; email: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.saveSession(res.token, res.user))
    );
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string; user: User }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => this.saveSession(res.token, res.user))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'admin' || user?.email?.toLowerCase() === 'admin@gmail.com';
  }

  isClient(): boolean {
    return this.isAuthenticated() && !this.isAdmin();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private saveSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }
}
