import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento, PlanStatus } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-admin-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="admin-shell">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Panel Admin</span>
          <h1>{{ isRequestsView() ? 'Solicitudes de clientes listas para revisar.' : 'Agenda de planes confirmados.' }}</h1>
          <p>{{ isRequestsView() ? 'Acepta la solicitud y se movera automaticamente a la agenda.' : 'Aqui solo gestionas las entradas ya aceptadas.' }}</p>
        </div>

        <div class="hero-actions">
          <a *ngIf="isRequestsView()" mat-raised-button color="primary" routerLink="/admin/events">Ir a agenda</a>
          <a *ngIf="!isRequestsView()" mat-raised-button color="primary" routerLink="/admin/events/new">Crear evento</a>
          <a mat-stroked-button routerLink="/eventos">Ver galeria publica</a>
        </div>
      </section>

      <div *ngIf="loading()" class="state-card">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando panel...</p>
      </div>

      <section *ngIf="!loading() && isRequestsView() && pendingRequests().length === 0" class="state-card">
        <div class="ui-mark">ES</div>
        <h2>No hay solicitudes pendientes</h2>
        <p>Ahora mismo no tienes planes de clientes esperando confirmacion.</p>
        <a mat-raised-button color="primary" routerLink="/admin/events">Ir a eventos</a>
      </section>

      <section *ngIf="!loading() && isRequestsView() && pendingRequests().length > 0" class="requests-panel">
        <div class="requests-head">
          <div>
            <span class="eyebrow">Solicitudes</span>
            <h2>{{ pendingRequests().length }} pendientes</h2>
          </div>
          <a mat-stroked-button routerLink="/admin/events">Ver agenda</a>
        </div>

        <div class="requests-grid">
          <article *ngFor="let item of pendingRequests()" class="request-card">
            <div class="request-copy">
              <span class="owner-chip" *ngIf="item.ownerEmail">{{ item.ownerEmail }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.planName || 'Plan solicitado' }}</p>
              <p>{{ formatEventDate(item.eventDate) }}</p>
              <p *ngIf="item.selectedExtras?.length">Extras: {{ extrasLabel(item) }}</p>
              <p *ngIf="item.customExtraNote">{{ item.customExtraNote }}</p>
            </div>

            <div class="request-actions">
              <button mat-raised-button color="primary" type="button" [disabled]="busyIds().includes(item.id)" (click)="acceptRequest(item)">Aceptar solicitud</button>
              <button mat-stroked-button class="danger-button" type="button" [disabled]="busyIds().includes(item.id)" (click)="rejectRequest(item)">Rechazar solicitud</button>
            </div>
          </article>
        </div>
      </section>

      <section *ngIf="!loading() && !isRequestsView() && items().length === 0" class="state-card">
        <div class="ui-mark">ES</div>
        <h2>Aun no tienes eventos</h2>
        <p>Crea el primero y decide despues si se queda como borrador o si pasa a la galeria publica.</p>
        <a mat-raised-button color="primary" routerLink="/admin/events/new">Crear primer evento</a>
      </section>

      <section *ngIf="!loading() && !isRequestsView() && items().length > 0" class="events-panel">
        <div class="events-head">
          <div>
            <span class="eyebrow">Agenda</span>
            <h2>{{ approvedItems().length }} entradas aceptadas</h2>
          </div>
          <p>Desde aqui puedes abrir y gestionar solo las solicitudes que ya han sido aceptadas.</p>
        </div>

        <div class="events-grid">
          <article *ngFor="let item of approvedItems()" class="event-card">
            <div class="event-top">
              <div class="thumb" [style.background-image]="getCoverStyle(item)"></div>
              <div class="event-copy">
                <h3>{{ item.title }}</h3>
                <p>{{ item.slug }}</p>
                <span class="owner-chip" *ngIf="item.ownerEmail">{{ item.ownerEmail }}</span>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-chip">
                <span>Fecha</span>
                <strong>{{ formatEventDate(item.eventDate) }}</strong>
              </div>
              <div class="meta-chip">
                <span>Publico</span>
                <strong class="status-badge" [class.status-badge--published]="item.isPublished">
                  {{ item.isPublished ? 'Publicado' : 'Privado' }}
                </strong>
              </div>
              <div class="meta-chip">
                <span>Revision</span>
                <strong class="status-badge" [ngClass]="'status-plan-' + item.status">
                  {{ planStatusLabel(item.status) }}
                </strong>
              </div>
            </div>

            <div class="card-actions">
              <a mat-stroked-button [routerLink]="['/admin/events', item.id, 'edit']">Editar</a>
              <button mat-stroked-button class="danger-button" type="button" (click)="delete(item)">Eliminar</button>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero-card,
      .state-card,
      .requests-panel,
      .events-panel,
      .request-card,
      .event-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .hero-card {
        padding: 2rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        background:
          radial-gradient(circle at top right, rgba(212, 175, 122, 0.22), transparent 28%),
          linear-gradient(135deg, #f9f2ea 0%, #efe4d8 100%);
      }
      h1, h2, h3 {
        margin: 0;
        font-family: var(--font-display);
        line-height: 1.08;
      }
      h1 {
        margin-bottom: 0.6rem;
        font-size: clamp(2.3rem, 4vw, 4.3rem);
        max-width: 12ch;
      }
      h2 {
        font-size: clamp(1.8rem, 3vw, 2.4rem);
      }
      .hero-card p,
      .state-card p,
      .events-head p,
      .request-copy p,
      .event-copy p {
        color: var(--text-soft);
      }
      .hero-actions,
      .card-actions,
      .request-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .state-card {
        min-height: 260px;
        display: grid;
        place-items: center;
        gap: 0.85rem;
        text-align: center;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      .requests-panel,
      .events-panel {
        padding: 1.4rem;
        background: rgba(255, 255, 255, 0.84);
      }
      .requests-head,
      .events-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1rem;
      }
      .requests-grid,
      .events-grid {
        display: grid;
        gap: 1rem;
      }
      .requests-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }
      .events-grid {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .request-card,
      .event-card {
        padding: 1.2rem;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
      }
      .request-copy,
      .event-copy {
        display: grid;
        gap: 0.35rem;
      }
      .event-top {
        display: grid;
        grid-template-columns: 88px minmax(0, 1fr);
        gap: 1rem;
        align-items: start;
      }
      .thumb {
        width: 88px;
        height: 88px;
        border-radius: 22px;
        background: linear-gradient(135deg, rgba(212, 175, 122, 0.3), rgba(245, 230, 218, 0.9));
        background-size: cover;
        background-position: center;
      }
      .owner-chip {
        display: inline-flex;
        width: fit-content;
        margin-top: 0.35rem;
        padding: 0.34rem 0.58rem;
        border-radius: 8px;
        background: rgba(44, 44, 44, 0.06);
        color: var(--text-soft);
        font-size: 0.82rem;
        font-weight: 800;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .meta-chip {
        padding: 0.9rem;
        border-radius: 18px;
        background: rgba(244, 231, 214, 0.52);
      }
      .meta-chip span {
        display: block;
        color: var(--muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .meta-chip strong {
        display: block;
        margin-top: 0.35rem;
      }
      .status-badge {
        display: inline-flex;
        width: fit-content;
        padding: 0.48rem 0.8rem;
        border-radius: 999px;
        background: rgba(120, 120, 120, 0.12);
        color: #5f5a54;
        font-size: 0.86rem;
      }
      .status-badge--published,
      .status-plan-approved {
        background: rgba(110, 203, 141, 0.18);
        color: #418b58;
      }
      .status-plan-pending_review {
        background: rgba(212, 175, 122, 0.16);
        color: var(--accent-strong);
      }
      .status-plan-rejected {
        background: rgba(200, 72, 72, 0.14);
        color: #b54848;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--text);
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .toggle input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .toggle-ui {
        position: relative;
        width: 58px;
        height: 32px;
        border-radius: 999px;
        background: rgba(120, 120, 120, 0.24);
        transition: background 0.25s ease;
      }
      .toggle-ui::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 6px 16px rgba(44, 44, 44, 0.18);
        transition: transform 0.25s ease;
      }
      .toggle input:checked + .toggle-ui {
        background: linear-gradient(135deg, #7cc18d 0%, #5aa872 100%);
      }
      .toggle input:checked + .toggle-ui::after {
        transform: translateX(26px);
      }
      .toggle--busy {
        opacity: 0.6;
      }
      .danger-button {
        border-color: rgba(200, 72, 72, 0.24) !important;
        color: #b54848 !important;
      }
      @media (max-width: 760px) {
        .hero-card,
        .requests-head,
        .events-head,
        .event-top,
        .meta-grid {
          display: grid;
          align-items: flex-start;
        }
        .meta-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminEventsListComponent implements OnInit, OnDestroy {
  items = signal<Evento[]>([]);
  loading = signal(false);
  busyIds = signal<number[]>([]);
  pendingRequests = computed(() => this.items().filter((item) => item.status === 'pending_review'));
  approvedItems = computed(() => this.items().filter((item) => item.status === 'approved'));
  isRequestsView = signal(false);
  private pollId: ReturnType<typeof setInterval> | null = null;

  constructor(private eventsService: EventoService, private router: Router) {}

  ngOnInit(): void {
    this.isRequestsView.set(this.router.url.includes('/admin/requests'));
    this.loadItems();
    this.pollId = setInterval(() => this.loadItems(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollId) {
      clearInterval(this.pollId);
    }
  }

  loadItems(showLoader = true): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.eventsService.getAllEventsAdmin().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  togglePublish(item: Evento, isPublished: boolean): void {
    this.busyIds.update((ids) => [...ids, item.id]);
    this.eventsService.togglePublish(item.id, isPublished).subscribe({
      next: (updated) => {
        this.items.update((items) => items.map((current) => current.id === updated.id ? { ...current, ...updated } : current));
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
      },
      error: () => this.busyIds.update((ids) => ids.filter((id) => id !== item.id)),
    });
  }

  acceptRequest(item: Evento): void {
    this.busyIds.update((ids) => [...ids, item.id]);
    this.eventsService.updateAdminEventStatus(item.id, 'approved').subscribe({
      next: (updated) => {
        this.items.update((items) => items.map((current) => current.id === updated.id ? { ...current, ...updated } : current));
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
        this.loadItems(false);
      },
      error: (error) => {
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
        alert(this.requestErrorMessage('aceptar', error));
      },
    });
  }

  rejectRequest(item: Evento): void {
    this.busyIds.update((ids) => [...ids, item.id]);
    this.eventsService.updateAdminEventStatus(item.id, 'rejected').subscribe({
      next: (updated) => {
        this.items.update((items) => items.map((current) => current.id === updated.id ? { ...current, ...updated } : current));
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
        this.loadItems(false);
      },
      error: (error) => {
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
        alert(this.requestErrorMessage('rechazar', error));
      },
    });
  }

  delete(item: Evento): void {
    if (!confirm(`Eliminar "${item.title}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    this.eventsService.deleteAdminEvent(item.id).subscribe({
      next: () => this.items.update((items) => items.filter((current) => current.id !== item.id)),
    });
  }

  formatEventDate(value?: string): string {
    if (!value) {
      return 'Pendiente';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(value));
  }

  getCoverStyle(item: Evento): string {
    const image = item.coverImage || item.images?.[0];
    return image ? `url('${this.eventsService.resolveAssetUrl(image)}')` : '';
  }

  planStatusLabel(status: PlanStatus): string {
    const labels: Record<PlanStatus, string> = {
      pending_review: 'Pendiente',
      approved: 'Confirmado',
      rejected: 'Rechazado',
    };

    return labels[status];
  }

  extrasLabel(item: Evento): string {
    return (item.selectedExtras || []).map((extra) => extra.name).join(', ');
  }

  private requestErrorMessage(action: 'aceptar' | 'rechazar', error?: HttpErrorResponse): string {
    const detail = typeof error?.error?.error === 'string' ? error.error.error : '';
    return detail
      ? `No se pudo ${action} la solicitud: ${detail}`
      : `No se pudo ${action} la solicitud. Reinicia el backend y vuelve a intentarlo.`;
  }
}
