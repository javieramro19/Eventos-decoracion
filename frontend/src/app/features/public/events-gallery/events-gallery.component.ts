import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-public-events-gallery',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="gallery-shell">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">Portfolio EventoSonic</span>
          <h1>Eventos publicados para inspirar la proxima celebracion.</h1>
          <p>Una seleccion abierta de montajes, ambientes y propuestas reales para mostrar el universo visual de la marca.</p>
        </div>
        <a mat-stroked-button routerLink="/" fragment="contacto">Solicitar presupuesto</a>
      </section>

      <div *ngIf="loading()" class="state-card">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando galeria publica...</p>
      </div>

      <section *ngIf="!loading() && items().length === 0" class="state-card">
        <div class="ui-mark">ES</div>
        <h2>Aun no hay eventos publicados</h2>
        <p>Muy pronto veras aqui una muestra del portfolio publico de EventoSonic.</p>
        <a mat-raised-button color="primary" routerLink="/" fragment="contacto">Pedir informacion</a>
      </section>

      <section *ngIf="!loading() && items().length > 0" class="cards-grid">
        <a *ngFor="let item of items()" class="event-card" [routerLink]="['/eventos', item.slug]">
          <div class="media" [style.background-image]="getCoverStyle(item)"></div>
          <div class="copy">
            <span class="date-pill">{{ formatEventDate(item.eventDate) }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ excerpt(item.description) }}</p>
          </div>
        </a>
      </section>
    </div>
  `,
  styles: [
    `
      .gallery-shell {
        width: var(--container);
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero,
      .state-card,
      .event-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .hero {
        min-height: 280px;
        padding: clamp(2rem, 5vw, 3rem);
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        background:
          linear-gradient(120deg, rgba(28, 23, 18, 0.72), rgba(28, 23, 18, 0.4)),
          radial-gradient(circle at top right, rgba(212, 175, 122, 0.32), transparent 28%),
          url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80') center/cover;
        color: #fffaf6;
      }
      h1, h2 {
        margin: 0;
        font-family: var(--font-display);
        line-height: 1.06;
      }
      h1 {
        margin: 0.8rem 0 0.75rem;
        font-size: clamp(2.6rem, 6vw, 5rem);
        max-width: 11ch;
      }
      .hero p,
      .copy p,
      .state-card p {
        color: inherit;
        opacity: 0.86;
      }
      .hero-copy {
        max-width: 44rem;
      }
      .state-card {
        min-height: 260px;
        display: grid;
        place-items: center;
        text-align: center;
        gap: 0.85rem;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .event-card {
        overflow: hidden;
        background: rgba(255, 255, 255, 0.88);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .event-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-lg);
      }
      .media {
        min-height: 280px;
        background:
          linear-gradient(135deg, rgba(212, 175, 122, 0.24), rgba(245, 230, 218, 0.82));
        background-size: cover;
        background-position: center;
      }
      .copy {
        padding: 1.35rem;
      }
      .copy h2 {
        margin: 0.75rem 0 0.55rem;
        font-size: 2rem;
        color: var(--text);
      }
      .copy p {
        color: var(--text-soft);
      }
      .date-pill {
        display: inline-flex;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(212, 175, 122, 0.16);
        color: var(--accent-strong);
        font-size: 0.82rem;
        font-weight: 800;
      }
      @media (max-width: 980px) {
        .cards-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .hero {
          display: grid;
          align-items: flex-end;
        }
      }
    `,
  ],
})
export class PublicEventsGalleryComponent implements OnInit {
  items = signal<Evento[]>([]);
  loading = signal(false);

  constructor(private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loading.set(true);
    this.eventsService.getPublicEvents().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  excerpt(value?: string): string {
    const text = (value || 'Evento publicado proximamente con mas informacion visual y narrativa.').trim();
    return text.length > 145 ? `${text.slice(0, 142)}...` : text;
  }

  formatEventDate(value?: string): string {
    if (!value) {
      return 'Fecha por confirmar';
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  }

  getCoverStyle(item: Evento): string {
    const image = item.coverImage || item.images?.[0];
    return image ? `url('${image}')` : '';
  }
}
