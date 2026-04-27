import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="list-container">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Eventos</span>
          <h1>Gestiona tus propuestas y planes confirmados desde una sola vista.</h1>
          <p>Todo lo que sale de la landing termina aqui: eventos manuales, planes elegidos, extras y notas del cliente.</p>
        </div>
        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/" fragment="planes">Elegir plan</a>
          <a mat-stroked-button routerLink="new">Crear evento manual</a>
        </div>
      </section>

      <section class="filters-card">
        <div class="sonic-field">
          <label for="search">Buscar evento</label>
          <input id="search" [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Ej. plan elegante o boda en jardin">
        </div>

        <div class="sonic-field">
          <label for="category">Categoria</label>
          <select id="category" [(ngModel)]="selectedCategory" (ngModelChange)="onFilter()">
            <option value="">Todas</option>
            <option value="wedding">Boda</option>
            <option value="birthday">Cumpleanos</option>
            <option value="corporate">Corporativo</option>
            <option value="baptism">Bautizo</option>
            <option value="communion">Comunion</option>
            <option value="other">Otros</option>
          </select>
        </div>
      </section>

      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando eventos...</p>
      </div>

      <section *ngIf="!loading() && items().length === 0" class="empty-state">
        <div class="empty-mark">ES</div>
        <h2>No hay eventos todavia</h2>
        <p>Elige un plan o crea el primero manualmente para empezar a organizar propuestas, fechas y extras.</p>
        <a mat-raised-button color="primary" routerLink="/" fragment="planes">Ver planes</a>
      </section>

      <section *ngIf="!loading() && items().length > 0" class="items-grid">
        <article *ngFor="let item of items()" class="item-card">
          <div class="item-header">
            <div>
              <span class="status-badge" [ngClass]="getCategoryClass(item)">{{ formatCategory(item.category || 'other') }}</span>
              <span *ngIf="item.planName" class="status-badge status-badge--plan">{{ item.planName }}</span>
              <h3>{{ item.title }}</h3>
            </div>
          </div>

          <p>{{ item.description || 'Sin descripcion adicional.' }}</p>

          <div class="meta-grid">
            <div>
              <span>Fecha</span>
              <strong>{{ item.eventDate || 'Pendiente' }}</strong>
            </div>
            <div>
              <span>Lugar</span>
              <strong>{{ item.location || 'Por definir' }}</strong>
            </div>
            <div>
              <span>Precio estimado</span>
              <strong>{{ item.totalPrice ? (item.totalPrice | currency:'EUR':'symbol':'1.0-0') : 'Pendiente' }}</strong>
            </div>
            <div>
              <span>Extras</span>
              <strong>{{ item.selectedExtras?.length || 0 }}</strong>
            </div>
          </div>

          <div class="item-actions">
            <a mat-stroked-button [routerLink]="[item.id]">Ver detalle</a>
            <a mat-stroked-button [routerLink]="[item.id, 'edit']">Editar</a>
            <button mat-button color="warn" type="button" (click)="delete(item)">Eliminar</button>
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [
    `
      .list-container {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero-card, .filters-card, .empty-state, .item-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .hero-card {
        padding: 1.9rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        background:
          radial-gradient(circle at top right, rgba(190, 204, 184, 0.24), transparent 22%),
          linear-gradient(135deg, #f8f4ee 0%, #ece5db 100%);
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .eyebrow {
        color: var(--secondary-strong);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.74rem;
        font-weight: 800;
      }
      h1, h2, h3 {
        font-family: var(--font-display);
      }
      h1 {
        margin: 0.7rem 0 0.65rem;
        font-size: clamp(2.3rem, 4vw, 4rem);
        max-width: 13ch;
        line-height: 1.08;
      }
      h2, h3 {
        margin: 0;
        line-height: 1.08;
      }
      .hero-card p, .empty-state p, .item-card p { color: var(--text-soft); }
      .filters-card {
        padding: 1.2rem;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 1rem;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      .loading-state, .empty-state {
        min-height: 240px;
        display: grid;
        place-items: center;
        text-align: center;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      .empty-mark {
        width: 4rem;
        height: 4rem;
        display: grid;
        place-items: center;
        border-radius: 20px;
        background: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%);
        color: #fff;
        font-family: var(--font-display);
        font-size: 1.6rem;
        font-weight: 700;
      }
      .items-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      }
      .item-card {
        padding: 1.35rem;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
      }
      .status-badge {
        display: inline-flex;
        margin-bottom: 0.9rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 800;
      }
      .category-wedding { background: #f1ddd7; color: #8b5848; }
      .category-birthday { background: #f1e6d8; color: #8c6d4c; }
      .category-corporate { background: #e7ebe3; color: #687660; }
      .category-baptism { background: #e2e8dc; color: #66745f; }
      .category-communion { background: #ece4dc; color: #766659; }
      .category-other { background: #ede7e2; color: #665952; }
      .status-badge--plan {
        margin-left: 0.5rem;
        background: rgba(212, 175, 122, 0.16);
        color: var(--accent-strong);
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .meta-grid div {
        padding: 0.9rem;
        border-radius: 20px;
        background: rgba(243, 236, 226, 0.76);
      }
      .meta-grid span {
        display: block;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .meta-grid strong { color: var(--text); }
      .item-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }
      @media (max-width: 760px) {
        .hero-card, .filters-card {
          grid-template-columns: 1fr;
          display: grid;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class EventoListComponent implements OnInit {
  items = signal<Evento[]>([]);
  loading = signal(false);
  searchTerm = '';
  selectedCategory = '';

  constructor(private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.loading.set(true);
    this.eventsService.getAll({
      search: this.searchTerm || undefined,
      category: this.selectedCategory || undefined,
    }).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.loadItems();
  }

  onFilter(): void {
    this.loadItems();
  }

  delete(item: Evento): void {
    if (!confirm(`Eliminar "${item.title}"?`)) {
      return;
    }

    this.eventsService.delete(item.id).subscribe({
      next: () => this.items.update(items => items.filter(i => i.id !== item.id)),
    });
  }

  getCategoryClass(item: Evento): string {
    return `category-${(item.category || 'other').toLowerCase()}`;
  }

  formatCategory(value: string): string {
    const labels: Record<string, string> = {
      wedding: 'Boda',
      birthday: 'Cumpleanos',
      corporate: 'Corporativo',
      baptism: 'Bautizo',
      communion: 'Comunion',
      other: 'Otros',
    };

    return labels[value] || value;
  }
}
