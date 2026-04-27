import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, CreateEventoDto, UpdateEventoDto, DashboardStats } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { category?: string; search?: string; page?: number }): Observable<Evento[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    return this.http.get<Evento[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  create(data: CreateEventoDto): Observable<Evento> {
    return this.http.post<Evento>(this.apiUrl, data);
  }

  update(id: number, data: UpdateEventoDto): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats/summary`);
  }
}
