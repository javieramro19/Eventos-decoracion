import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-events-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-container">
      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando evento...</p>
      </div>

      <div *ngIf="!loading() && error()" class="error-state">
        <div class="ui-mark">!</div>
        <h2>{{ error() }}</h2>
        <a mat-raised-button color="primary" routerLink="/events">Volver a eventos</a>
      </div>

      <ng-container *ngIf="!loading() && item() as evento">
        <section class="hero-card">
          <div>
            <span class="eyebrow">{{ formatCategory(evento.category || 'other') }}</span>
            <h1>{{ evento.title }}</h1>
            <p>{{ evento.description || 'Este evento todavia no tiene una descripcion detallada.' }}</p>
            <p class="plan-pill" *ngIf="evento.planName">Plan confirmado: {{ evento.planName }}</p>
          </div>

          <div class="actions">
            <a mat-stroked-button routerLink="/events">Volver</a>
            <a mat-raised-button color="primary" [routerLink]="['/events', evento.id, 'edit']">Editar</a>
            <button mat-button color="warn" type="button" (click)="delete(evento)">Eliminar</button>
          </div>
        </section>

        <section class="content-grid">
          <article class="info-card">
            <h2>Resumen del montaje</h2>
            <div class="info-list">
              <div>
                <span>Fecha del evento</span>
                <strong>{{ evento.eventDate ? (evento.eventDate | date:'dd/MM/yyyy') : 'Pendiente de definir' }}</strong>
              </div>
              <div>
                <span>Lugar</span>
                <strong>{{ evento.location || 'Pendiente de confirmar' }}</strong>
              </div>
              <div>
                <span>Creado el</span>
                <strong>{{ evento.createdAt | date:'dd/MM/yyyy' }}</strong>
              </div>
              <div>
                <span>Categoria</span>
                <strong>{{ formatCategory(evento.category || 'other') }}</strong>
              </div>
              <div *ngIf="evento.totalPrice">
                <span>Precio estimado</span>
                <strong>{{ evento.totalPrice | currency:'EUR':'symbol':'1.0-0' }}</strong>
              </div>
              <div *ngIf="evento.selectedExtras?.length">
                <span>Extras seleccionados</span>
                <strong>{{ evento.selectedExtras?.length }}</strong>
              </div>
            </div>
          </article>

          <article class="info-card note-card">
            <h2>{{ evento.planName ? 'Configuracion del plan' : 'Descripcion del evento' }}</h2>
            <p>{{ evento.description || 'Todavia no hay comentarios o indicaciones adicionales para este evento.' }}</p>
            <div class="extras-list" *ngIf="evento.selectedExtras?.length">
              <div class="extra-row" *ngFor="let extra of evento.selectedExtras">
                <span>{{ extra.name }}</span>
                <strong>{{ extra.price | currency:'EUR':'symbol':'1.0-0' }}</strong>
              </div>
            </div>
            <p class="muted" *ngIf="evento.customExtraNote">Peticion personalizada: {{ evento.customExtraNote }}</p>
          </article>
        </section>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .detail-container {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero-card, .info-card, .loading-state, .error-state {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
        background: var(--surface);
      }
      .hero-card {
        padding: 1.8rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        background: linear-gradient(180deg, #fffdf9 0%, #f8efe4 100%);
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
        margin: 0.7rem 0 0.5rem;
        font-size: clamp(2.3rem, 4vw, 4rem);
        line-height: 1.08;
      }
      h2 {
        margin: 0 0 1rem;
        font-size: 2rem;
        line-height: 1.08;
      }
      p, .muted { color: var(--text-soft); }
      .plan-pill {
        display: inline-flex;
        margin-top: 0.4rem;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(212, 175, 122, 0.12);
        color: var(--accent-strong);
        font-weight: 700;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .content-grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 1rem;
      }
      .info-card {
        padding: 1.5rem;
      }
      .info-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .info-list div {
        padding: 1rem;
        border-radius: 22px;
        background: var(--surface-alt);
      }
      .info-list span {
        display: block;
        color: var(--muted);
        font-size: 0.85rem;
      }
      .note-card {
        background:
          radial-gradient(circle at top right, rgba(212, 175, 122, 0.08), transparent 30%),
          var(--surface);
      }
      .extras-list {
        display: grid;
        gap: 0.7rem;
        margin-top: 1.2rem;
      }
      .extra-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border-radius: 18px;
        background: var(--surface-alt);
      }
      .loading-state, .error-state {
        min-height: 240px;
        display: grid;
        place-items: center;
        text-align: center;
        gap: 0.8rem;
      }
      @media (max-width: 860px) {
        .hero-card, .content-grid {
          grid-template-columns: 1fr;
          display: grid;
          align-items: flex-start;
        }
        .info-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EventoDetailComponent implements OnInit {
  item = signal<Evento | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private eventsService: EventoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) {
      this.error.set('ID invalido');
      return;
    }

    this.loading.set(true);
    this.eventsService.getById(id).subscribe({
      next: evento => {
        this.item.set(evento);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Evento no encontrado');
        this.loading.set(false);
      },
    });
  }

  delete(evento: Evento): void {
    if (!confirm(`Eliminar "${evento.title}"?`)) {
      return;
    }

    this.eventsService.delete(evento.id).subscribe({
      next: () => this.router.navigate(['/events']),
    });
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
