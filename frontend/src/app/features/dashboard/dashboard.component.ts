import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { EventoService } from '../../core/services/events.service';
import { ContactStatus, DashboardStatItem, DashboardStats, EventContact } from '../../core/models/event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard-container">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Panel de gestion</span>
          <h1>Hola, {{ authService.currentUser()?.name || 'cliente' }}.</h1>
          <p class="subtitle">Controla de un vistazo tus eventos publicados, las solicitudes pendientes y las oportunidades que necesitan respuesta.</p>
        </div>

        <div class="quick-actions">
          <a mat-raised-button color="primary" routerLink="/admin/events/new">Nuevo evento</a>
          <a mat-stroked-button routerLink="/admin/contacts">Ver solicitudes</a>
        </div>
      </section>

      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando metricas del panel...</p>
      </div>

      <ng-container *ngIf="!loading() && stats() as data">
        <section class="metrics-grid">
          <mat-card class="metric-card accent">
            <mat-card-content>
              <span class="metric-label">Eventos totales</span>
              <strong>{{ data.totalEvents }}</strong>
              <p>Todos los proyectos guardados en tu cuenta.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <span class="metric-label">Eventos publicados</span>
              <strong>{{ data.publishedEvents }}</strong>
              <p>Ya visibles en la parte publica del portfolio.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card warning">
            <mat-card-content>
              <span class="metric-label">Solicitudes pendientes</span>
              <strong>{{ data.pendingContacts }}</strong>
              <p>{{ data.stalePendingContacts > 0 ? data.stalePendingContacts + ' llevan mas de 24h sin respuesta.' : 'Revisa y convierte nuevas oportunidades.' }}</p>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="alerts-card" *ngIf="data.alerts.length > 0">
          <div class="section-head">
            <div>
              <span class="eyebrow">Alertas</span>
              <h2>Lo que requiere atencion hoy</h2>
            </div>
          </div>

          <div class="alerts-list">
            <article *ngFor="let alert of data.alerts" class="alert-item" [class.alert-item--high]="alert.severity === 'high'">
              <strong>{{ alertLabel(alert) }}</strong>
              <p>{{ alert.message }}</p>
            </article>
          </div>
        </section>

        <div class="content-grid">
          <section class="panel-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Solicitudes recientes</span>
                <h2>Contactos que acaban de entrar</h2>
              </div>
              <a mat-stroked-button routerLink="/admin/contacts">Gestionarlas</a>
            </div>

            <div *ngIf="data.recentContacts.length === 0" class="empty-inline">
              Aun no hay solicitudes recientes.
            </div>

            <div *ngIf="data.recentContacts.length > 0" class="list-stack">
              <article *ngFor="let contact of data.recentContacts" class="list-item">
                <div>
                  <span class="badge" [ngClass]="'badge-' + contact.status">{{ contactStatusLabel(contact.status) }}</span>
                  <a class="item-title" [routerLink]="['/admin/contacts']">{{ contact.name }}</a>
                  <p>{{ contact.eventTitle || 'Evento' }} · {{ contact.email }}</p>
                </div>
                <div class="item-meta">
                  <span>{{ formatDate(contact.createdAt) }}</span>
                  <a *ngIf="contact.eventSlug" [routerLink]="['/eventos', contact.eventSlug]">Ver publico</a>
                </div>
              </article>
            </div>
          </section>

          <section class="panel-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Acceso rapido</span>
                <h2>Eventos recientes</h2>
              </div>
              <a mat-stroked-button routerLink="/admin/events">Todos los eventos</a>
            </div>

            <div *ngIf="data.recentEvents.length === 0" class="empty-inline">
              Aun no has creado eventos recientes.
            </div>

            <div *ngIf="data.recentEvents.length > 0" class="list-stack">
              <article *ngFor="let event of data.recentEvents" class="list-item">
                <div>
                  <span class="badge" [ngClass]="event.isPublished ? 'badge-published' : 'badge-draft'">
                    {{ event.isPublished ? 'Publicado' : 'Borrador' }}
                  </span>
                  <a class="item-title" [routerLink]="['/admin/events', event.id, 'edit']">{{ event.title }}</a>
                  <p>{{ event.planName || formatCategory(event.category || 'other') }}</p>
                </div>
                <div class="item-meta">
                  <span>{{ formatDate(event.createdAt) }}</span>
                  <a [routerLink]="['/admin/events', event.id, 'edit']">Editar</a>
                </div>
              </article>
            </div>
          </section>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1.2rem;
      }
      .hero-card,
      .alerts-card,
      .panel-card,
      .metric-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        background: rgba(255, 253, 250, 0.92);
      }
      .hero-card {
        padding: 2rem;
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
        align-items: flex-end;
        background:
          radial-gradient(circle at top left, rgba(202, 170, 145, 0.16), transparent 26%),
          linear-gradient(180deg, #fbf5ee 0%, #f5ede4 100%);
      }
      .eyebrow {
        color: var(--accent-strong);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.74rem;
        font-weight: 800;
      }
      h1, h2 { font-family: var(--font-display); }
      h1 {
        margin: 0.65rem 0 0;
        font-size: clamp(2.4rem, 4vw, 4rem);
        line-height: 1.08;
      }
      h2 {
        margin: 0.4rem 0 0;
        font-size: 2rem;
        line-height: 1.08;
      }
      .subtitle {
        max-width: 58ch;
        margin: 0.8rem 0 0;
        color: var(--muted);
      }
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .loading-state {
        display: grid;
        place-items: center;
        min-height: 240px;
        color: var(--muted);
      }
      .metrics-grid,
      .content-grid {
        display: grid;
        gap: 1rem;
      }
      .metrics-grid {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .content-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .metric-card mat-card-content {
        padding: 1.35rem;
      }
      .metric-card.accent {
        background: linear-gradient(160deg, #a86f4d 0%, #c9ab8f 100%);
        color: #fff;
      }
      .metric-card.warning {
        background: linear-gradient(160deg, #f7efe1 0%, #f0dfbf 100%);
      }
      .metric-label {
        display: block;
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.85;
      }
      .metric-card strong {
        display: block;
        margin: 0.55rem 0;
        font-size: 2.2rem;
        line-height: 1;
        font-family: var(--font-display);
      }
      .metric-card p {
        margin: 0;
        color: inherit;
        opacity: 0.82;
      }
      .alerts-card,
      .panel-card {
        padding: 1.5rem;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .alerts-list,
      .list-stack {
        display: grid;
        gap: 0.9rem;
        margin-top: 1rem;
      }
      .alert-item,
      .list-item {
        padding: 1rem;
        border-radius: 24px;
        background: rgba(243, 236, 226, 0.76);
      }
      .alert-item--high {
        background: rgba(245, 210, 210, 0.76);
      }
      .alert-item strong,
      .item-title {
        display: inline-block;
        font-weight: 800;
        color: var(--text);
      }
      .item-title {
        text-decoration: none;
        margin-top: 0.55rem;
      }
      .alert-item p,
      .list-item p,
      .empty-inline {
        margin: 0.4rem 0 0;
        color: var(--muted);
      }
      .list-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .item-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
        color: var(--text-soft);
      }
      .badge {
        display: inline-flex;
        padding: 0.38rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 800;
      }
      .badge-pending,
      .badge-draft {
        background: rgba(212, 175, 122, 0.16);
        color: var(--accent-strong);
      }
      .badge-contacted {
        background: rgba(111, 160, 215, 0.16);
        color: #406b9e;
      }
      .badge-converted,
      .badge-published {
        background: rgba(110, 203, 141, 0.18);
        color: #418b58;
      }
      .badge-rejected {
        background: rgba(200, 72, 72, 0.14);
        color: #b54848;
      }
      .empty-inline {
        padding: 1rem 0;
      }
      @media (max-width: 900px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .hero-card,
        .section-head,
        .list-item {
          display: grid;
        }
        .item-meta {
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(false);

  constructor(public authService: AuthService, private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.eventsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  alertLabel(alert: DashboardStatItem): string {
    return alert.severity === 'high' ? 'Atencion prioritaria' : 'Recordatorio';
  }

  contactStatusLabel(status: ContactStatus): string {
    const labels: Record<ContactStatus, string> = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      converted: 'Convertido',
      rejected: 'Rechazado',
    };

    return labels[status];
  }

  formatCategory(value: string): string {
    const map: Record<string, string> = {
      wedding: 'Boda',
      birthday: 'Cumpleanos',
      corporate: 'Corporativo',
      baptism: 'Bautizo',
      communion: 'Comunion',
      other: 'Otros',
    };

    return map[value] || value;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }
}
