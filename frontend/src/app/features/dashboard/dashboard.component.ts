import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { EventoService } from '../../core/services/events.service';
import { DashboardStats } from '../../core/models/event.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard-container">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Panel de control</span>
          <h1>Hola, {{ authService.currentUser()?.name || 'cliente' }}.</h1>
          <p class="subtitle">Aqui tienes una vista rapida de tus propuestas, planes confirmados y accesos directos para seguir organizando el evento.</p>
        </div>

        <div class="quick-actions">
          <a mat-raised-button color="primary" routerLink="/" fragment="planes">Elegir plan</a>
          <a mat-stroked-button routerLink="/events">Ver eventos</a>
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
              <span class="metric-label">Total de eventos</span>
              <strong>{{ data.total }}</strong>
              <p>Todos los proyectos registrados en tu cuenta.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card">
            <mat-card-content>
              <span class="metric-label">Actividad semanal</span>
              <strong>{{ data.thisWeek }}</strong>
              <p>Eventos creados durante los ultimos 7 dias.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="metric-card" *ngFor="let item of data.byStatus">
            <mat-card-content>
              <span class="metric-label">{{ formatStatus(item.status) }}</span>
              <strong>{{ item.count }}</strong>
              <p>Registros asociados a esta categoria.</p>
            </mat-card-content>
          </mat-card>
        </section>

        <section class="recent-card" *ngIf="data.recent.length > 0; else emptyRecent">
          <div class="section-head">
            <div>
              <span class="eyebrow">Actividad reciente</span>
              <h2>Ultimas propuestas guardadas</h2>
            </div>
          </div>

          <div class="recent-list">
            <article *ngFor="let event of data.recent" class="recent-item">
              <div>
                <a class="recent-title" [routerLink]="['/events', event.id]">{{ event.title }}</a>
                <p>{{ event.description || 'Sin descripcion anadida por ahora.' }}</p>
                <span class="recent-plan" *ngIf="event.planName">Plan confirmado: {{ event.planName }}</span>
              </div>
              <div class="recent-meta">
                <span>{{ event.createdAt | date:'dd/MM/yyyy' }}</span>
                <strong>{{ event.totalPrice ? (event.totalPrice | currency:'EUR':'symbol':'1.0-0') : formatStatus(event.category || 'other') }}</strong>
              </div>
            </article>
          </div>
        </section>

        <ng-template #emptyRecent>
          <section class="recent-card empty-card">
            <div class="ui-mark">ES</div>
            <h2>Aun no hay actividad reciente</h2>
            <p>Elige un plan o crea tu primer evento manual para empezar a organizar propuestas y extras.</p>
          </section>
        </ng-template>
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
      .hero-card, .recent-card, .metric-card {
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
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .metric-card mat-card-content {
        padding: 1.35rem;
      }
      .metric-card.accent {
        background: linear-gradient(160deg, #a86f4d 0%, #c9ab8f 100%);
        color: #fff;
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
      .recent-card {
        padding: 1.6rem;
      }
      .recent-list {
        display: grid;
        gap: 0.9rem;
        margin-top: 1rem;
      }
      .recent-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        border-radius: 24px;
        background: rgba(243, 236, 226, 0.76);
      }
      .recent-title {
        font-weight: 800;
        text-decoration: none;
        color: var(--text);
      }
      .recent-item p {
        margin: 0.3rem 0 0;
        color: var(--muted);
      }
      .recent-plan {
        display: inline-flex;
        margin-top: 0.75rem;
        padding: 0.42rem 0.7rem;
        border-radius: 999px;
        background: rgba(212, 175, 122, 0.12);
        color: var(--accent-strong);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .recent-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.4rem;
        color: var(--text-soft);
      }
      .recent-meta strong {
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: rgba(168, 111, 77, 0.12);
        color: var(--accent-strong);
      }
      .empty-card {
        display: grid;
        place-items: center;
        text-align: center;
        min-height: 240px;
        gap: 0.85rem;
      }
      .empty-card p { color: var(--muted); }
      @media (max-width: 760px) {
        .hero-card, .recent-item {
          flex-direction: column;
          align-items: flex-start;
        }
        .recent-meta {
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

  formatStatus(value: string): string {
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
}
