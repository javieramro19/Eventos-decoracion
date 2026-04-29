import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { EventoService } from '../../core/services/events.service';
import { Evento } from '../../core/models/event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard-container">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Mis solicitudes</span>
          <h1>Hola, {{ authService.currentUser()?.name || 'cliente' }}.</h1>
          <p class="subtitle">Aqui tienes tus planes enviados a EventoSonic. Puedes revisar cada solicitud, ajustarla y ver si ya ha sido confirmada o denegada.</p>
        </div>

        <div class="quick-actions">
          <a mat-raised-button color="primary" routerLink="/" fragment="planes">Crear nueva solicitud</a>
          <a mat-stroked-button routerLink="/eventos">Ver eventos publicos</a>
        </div>
      </section>

      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando tus solicitudes...</p>
      </div>

      <section *ngIf="!loading() && requests().length === 0" class="empty-card">
        <div class="ui-mark">ES</div>
        <h2>Aun no has enviado ninguna solicitud</h2>
        <p>Elige un plan, marca extras y te apareceran aqui como una bandeja para seguirlas despues.</p>
        <a mat-raised-button color="primary" routerLink="/" fragment="planes">Ver planes</a>
      </section>

      <section *ngIf="!loading() && requests().length > 0" class="requests-card">
        <div class="requests-head">
          <div>
            <span class="eyebrow">Bandeja</span>
            <h2>{{ requests().length }} solicitudes registradas</h2>
          </div>
          <p>La confirmacion final solo aparece cuando el admin aprueba tu plan.</p>
        </div>

        <div class="requests-list">
          <a *ngFor="let event of requests()" class="request-row" [routerLink]="['/dashboard/events', event.id, 'edit']">
            <div class="request-main">
              <span class="badge" [ngClass]="statusClass(event)">{{ statusLabel(event) }}</span>
              <h3>{{ event.title }}</h3>
              <p>{{ event.planName || 'Plan personalizado' }}</p>
            </div>

            <div class="request-summary">
              <strong>{{ event.totalPrice ? (event.totalPrice | currency:'EUR':'symbol':'1.0-0') : 'Precio pendiente' }}</strong>
              <span>{{ requestSnippet(event) }}</span>
            </div>

            <div class="request-meta">
              <span>{{ formatDate(event.updatedAt || event.createdAt) }}</span>
              <strong>Ver detalles</strong>
            </div>
          </a>
        </div>
      </section>
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
      .requests-card,
      .empty-card {
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
      h1, h2, h3 {
        margin: 0;
        font-family: var(--font-display);
      }
      h1 {
        margin-top: 0.65rem;
        font-size: clamp(2.4rem, 4vw, 4rem);
        line-height: 1.08;
      }
      h2 {
        margin-top: 0.45rem;
        font-size: 2rem;
        line-height: 1.08;
      }
      h3 {
        margin-top: 0.55rem;
        font-size: 1.3rem;
      }
      .subtitle,
      .requests-head p,
      .request-main p,
      .request-summary span,
      .request-meta span,
      .empty-card p {
        color: var(--muted);
      }
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .loading-state,
      .empty-card {
        min-height: 240px;
        display: grid;
        place-items: center;
        text-align: center;
        gap: 0.8rem;
      }
      .requests-card {
        padding: 1.4rem;
      }
      .requests-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1rem;
      }
      .requests-list {
        display: grid;
        gap: 0.85rem;
      }
      .request-row {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(220px, 1fr) minmax(150px, 0.65fr);
        gap: 1rem;
        align-items: center;
        padding: 1rem 1.15rem;
        border-radius: 24px;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
        color: inherit;
        text-decoration: none;
        border: 1px solid rgba(44, 44, 44, 0.06);
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }
      .request-row:hover {
        transform: translateY(-3px);
        box-shadow: 0 16px 34px rgba(44, 44, 44, 0.08);
      }
      .request-summary,
      .request-meta {
        display: grid;
        gap: 0.3rem;
      }
      .request-summary strong,
      .request-meta strong {
        color: var(--text);
      }
      .request-meta {
        justify-items: end;
      }
      .badge {
        display: inline-flex;
        width: fit-content;
        padding: 0.38rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 800;
      }
      .badge-draft {
        background: rgba(212, 175, 122, 0.16);
        color: var(--accent-strong);
      }
      .badge-published {
        background: rgba(110, 203, 141, 0.18);
        color: #418b58;
      }
      .badge-rejected {
        background: rgba(200, 72, 72, 0.14);
        color: #b54848;
      }
      @media (max-width: 900px) {
        .request-row {
          grid-template-columns: 1fr;
          align-items: flex-start;
        }
        .request-meta {
          justify-items: start;
        }
      }
      @media (max-width: 760px) {
        .hero-card,
        .requests-head {
          display: grid;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  requests = signal<Evento[]>([]);
  loading = signal(false);
  private pollId: ReturnType<typeof setInterval> | null = null;

  constructor(public authService: AuthService, private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loadRequests(true);
    this.pollId = setInterval(() => this.loadRequests(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollId) {
      clearInterval(this.pollId);
    }
  }

  loadRequests(showLoader = true): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.eventsService.getClientEvents().subscribe({
      next: (items) => {
        const sorted = items.slice().sort((left, right) => {
          return new Date(right.updatedAt || right.createdAt).getTime() - new Date(left.updatedAt || left.createdAt).getTime();
        });
        this.requests.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(event: Evento): string {
    if (event.status === 'approved') {
      return event.isPublished ? 'Publicado' : 'Confirmado';
    }

    if (event.status === 'rejected') {
      return 'Solicitud denegada';
    }

    return 'Pendiente';
  }

  statusClass(event: Evento): string {
    if (event.status === 'approved') {
      return 'badge-published';
    }

    if (event.status === 'rejected') {
      return 'badge-rejected';
    }

    return 'badge-draft';
  }

  requestSnippet(event: Evento): string {
    if (event.status === 'approved') {
      return 'Tu plan ya esta confirmado por administracion.';
    }

    if (event.status === 'rejected') {
      return 'La solicitud fue denegada y puede requerir una nueva propuesta.';
    }

    return 'Esperando revision del equipo de EventoSonic.';
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
