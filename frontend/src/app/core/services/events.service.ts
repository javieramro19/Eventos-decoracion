import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Evento, CreateEventoDto, UpdateEventoDto, DashboardStats, GalleryImage, GalleryMutationResponse } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private adminApiUrl = `${environment.apiUrl}/admin/events`;
  private publicApiUrl = `${environment.apiUrl}/public/events`;
  private assetsBaseUrl = environment.apiUrl.replace(/\/api$/, '');

  constructor(private http: HttpClient) {}

  getAllEventsAdmin(filters?: { category?: string; search?: string; page?: number }): Observable<Evento[]> {
    let params = new HttpParams();
    if (filters?.category) params = params.set('category', filters.category);
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.page) params = params.set('page', filters.page.toString());
    return this.http.get<Evento[]>(this.adminApiUrl, { params });
  }

  getAdminEventById(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.adminApiUrl}/${id}`);
  }

  createAdminEvent(data: CreateEventoDto): Observable<Evento> {
    return this.http.post<Evento>(this.adminApiUrl, data);
  }

  updateAdminEvent(id: number, data: UpdateEventoDto): Observable<Evento> {
    return this.http.put<Evento>(`${this.adminApiUrl}/${id}`, data);
  }

  deleteAdminEvent(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.adminApiUrl}/${id}`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.adminApiUrl}/stats/summary`);
  }

  getPublicEvents(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.publicApiUrl);
  }

  getPublicEventBySlug(slug: string): Observable<Evento> {
    return this.http.get<Evento>(`${this.publicApiUrl}/${slug}`);
  }

  togglePublish(id: number, isPublished: boolean): Observable<Evento> {
    const action = isPublished ? 'publish' : 'unpublish';
    return this.http.put<Evento>(`${this.adminApiUrl}/${id}/${action}`, {});
  }

  getEventGallery(id: number): Observable<GalleryImage[]> {
    return this.http.get<GalleryImage[]>(`${this.adminApiUrl}/${id}/gallery`);
  }

  uploadEventImages(id: number, files: File[]): Observable<GalleryMutationResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }

    return this.http.post<GalleryMutationResponse>(`${this.adminApiUrl}/${id}/gallery/upload`, formData);
  }

  reorderEventGallery(id: number, items: Array<{ id: number; order: number }>): Observable<GalleryMutationResponse> {
    return this.http.put<GalleryMutationResponse>(`${this.adminApiUrl}/${id}/gallery/reorder`, { items });
  }

  updateGalleryImage(
    id: number,
    imageId: number,
    data: { caption?: string; isActive?: boolean }
  ): Observable<GalleryMutationResponse> {
    return this.http.put<GalleryMutationResponse>(`${this.adminApiUrl}/${id}/gallery/${imageId}`, data);
  }

  deleteGalleryImage(id: number, imageId: number): Observable<GalleryMutationResponse> {
    return this.http.delete<GalleryMutationResponse>(`${this.adminApiUrl}/${id}/gallery/${imageId}`);
  }

  resolveAssetUrl(url?: string | null): string {
    if (!url) {
      return '';
    }

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return `${this.assetsBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  }

  getAll(filters?: { category?: string; search?: string; page?: number }): Observable<Evento[]> {
    return this.getAllEventsAdmin(filters);
  }

  getById(id: number): Observable<Evento> {
    return this.getAdminEventById(id);
  }

  create(data: CreateEventoDto): Observable<Evento> {
    return this.createAdminEvent(data);
  }

  update(id: number, data: UpdateEventoDto): Observable<Evento> {
    return this.updateAdminEvent(id, data);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.deleteAdminEvent(id);
  }
}
