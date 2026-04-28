import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento } from '../../../core/models/event.model';
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
          <h1>Gestiona qué eventos viven en privado y cuáles salen a tu escaparate público.</h1>
          <p>Publica, despublica, edita y ordena toda tu cartera de montajes desde un dashboard claro y rápido.</p>
        </div>

        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/admin/events/new">Crear evento</a>
          <a mat-stroked-button routerLink="/eventos">Ver galería pública</a>
        </div>
      </section>

      <div *ngIf="loading()" class="state-card">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando eventos del panel...</p>
      </div>

      <section *ngIf="!loading() && items().length === 0" class="state-card">
        <div class="ui-mark">ES</div>
        <h2>Aún no tienes eventos</h2>
        <p>Crea el primero y decide después si se queda como borrador o si pasa a la galería pública.</p>
        <a mat-raised-button color="primary" routerLink="/admin/events/new">Crear primer evento</a>
      </section>

      <section *ngIf="!loading() && items().length > 0" class="list-card">
        <div class="list-head">
          <div>
            <span class="eyebrow">Mis eventos</span>
            <h2>{{ items().length }} proyectos en tu panel</h2>
          </div>
          <p>Los publicados se muestran en la ruta publica /eventos; los borradores siguen siendo privados.</p>
        </div>

        <div class="table-wrap">
          <article *ngFor="let item of items()" class="event-row">
            <div class="event-main">
              <div class="thumb" [style.background-image]="getCoverStyle(item)"></div>
              <div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.slug }}</p>
              </div>
            </div>

            <div class="meta-cell">
              <span>Fecha</span>
              <strong>{{ formatEventDate(item.eventDate) }}</strong>
            </div>

            <div class="meta-cell">
              <span>Estado</span>
              <strong class="status-badge" [class.status-badge--published]="item.isPublished">
                {{ item.isPublished ? 'Publicado' : 'Borrador' }}
              </strong>
            </div>

            <label class="toggle" [class.toggle--busy]="busyIds().includes(item.id)">
              <input
                type="checkbox"
                [checked]="item.isPublished"
                [disabled]="busyIds().includes(item.id)"
                (change)="togglePublish(item, $any($event.target).checked)"
              >
              <span class="toggle-ui"></span>
              <span>{{ item.isPublished ? 'Despublicar' : 'Publicar' }}</span>
            </label>

            <div class="actions">
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
      .list-card,
      .state-card {
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
      .list-head p,
      .event-main p,
      .state-card p {
        color: var(--text-soft);
      }
      .hero-actions,
      .actions {
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
      .list-card {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.84);
      }
      .list-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1rem;
      }
      .table-wrap {
        display: grid;
        gap: 0.85rem;
      }
      .event-row {
        display: grid;
        grid-template-columns: minmax(0, 2.2fr) minmax(120px, 0.8fr) minmax(120px, 0.8fr) minmax(170px, 1fr) auto;
        gap: 1rem;
        align-items: center;
        padding: 1rem;
        border-radius: 24px;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
        border: 1px solid rgba(44, 44, 44, 0.06);
      }
      .event-main {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
      }
      .thumb {
        width: 88px;
        height: 88px;
        border-radius: 22px;
        background: linear-gradient(135deg, rgba(212, 175, 122, 0.3), rgba(245, 230, 218, 0.9));
        background-size: cover;
        background-position: center;
        flex-shrink: 0;
      }
      .event-main h3 {
        font-size: 1.35rem;
      }
      .event-main p {
        margin: 0.35rem 0 0;
        font-size: 0.9rem;
        overflow-wrap: anywhere;
      }
      .meta-cell {
        display: grid;
        gap: 0.35rem;
      }
      .meta-cell span {
        color: var(--muted);
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
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
      .status-badge--published {
        background: rgba(110, 203, 141, 0.18);
        color: #418b58;
      }
      .toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--text);
        font-weight: 700;
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
      @media (max-width: 1040px) {
        .event-row {
          grid-template-columns: 1fr;
          align-items: flex-start;
        }
      }
      @media (max-width: 760px) {
        .hero-card,
        .list-head {
          display: grid;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class AdminEventsListComponent implements OnInit {
  items = signal<Evento[]>([]);
  loading = signal(false);
  busyIds = signal<number[]>([]);

  constructor(private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
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
        this.items.update((items) => items.map((current) => current.id === updated.id ? updated : current));
        this.busyIds.update((ids) => ids.filter((id) => id !== item.id));
      },
      error: () => this.busyIds.update((ids) => ids.filter((id) => id !== item.id)),
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
}
