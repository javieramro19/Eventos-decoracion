import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContactStatus, EventContact } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="contacts-shell">
      <section class="hero-card">
        <div>
          <span class="eyebrow">Solicitudes</span>
          <h1>Gestiona los contactos que llegan desde tus eventos públicos.</h1>
          <p>Convierte la galería en un embudo comercial real: revisa mensajes, cambia estado y sigue cada oportunidad.</p>
        </div>
        <a mat-stroked-button routerLink="/admin/events">Volver a eventos</a>
      </section>

      <div *ngIf="loading()" class="state-card">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando solicitudes...</p>
      </div>

      <section *ngIf="!loading() && contacts().length === 0" class="state-card">
        <div class="ui-mark">ES</div>
        <h2>Aun no hay solicitudes</h2>
        <p>Cuando alguien use el formulario de contacto de un evento publicado, aparecerá aquí.</p>
      </section>

      <section *ngIf="!loading() && contacts().length > 0" class="list-card">
        <article *ngFor="let contact of contacts()" class="contact-card">
          <div class="contact-card__top">
            <div>
              <span class="status-badge" [ngClass]="'status-' + contact.status">{{ statusLabel(contact.status) }}</span>
              <h2>{{ contact.name }}</h2>
              <p>{{ contact.email }}<span *ngIf="contact.phone"> · {{ contact.phone }}</span></p>
            </div>
            <div class="contact-meta">
              <strong>{{ contact.eventTitle || 'Evento' }}</strong>
              <span>{{ formatDate(contact.createdAt) }}</span>
            </div>
          </div>

          <p class="message">{{ contact.message }}</p>

          <div class="contact-card__bottom">
            <a mat-stroked-button *ngIf="contact.eventSlug" [routerLink]="['/eventos', contact.eventSlug]">Ver evento</a>
            <div class="status-actions">
              <button
                *ngFor="let status of statuses"
                mat-stroked-button
                type="button"
                [disabled]="contact.status === status || busyIds().includes(contact.id)"
                [class.active-status]="contact.status === status"
                (click)="updateStatus(contact, status)"
              >
                {{ statusLabel(status) }}
              </button>
            </div>
          </div>
        </article>
      </section>
    </div>
  `,
  styles: [
    `
      .contacts-shell {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero-card,
      .state-card,
      .list-card,
      .contact-card {
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
      h1, h2 {
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
        font-size: 1.8rem;
      }
      .hero-card p,
      .state-card p,
      .contact-card p,
      .contact-meta span {
        color: var(--text-soft);
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
        padding: 1rem;
        display: grid;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.84);
      }
      .contact-card {
        padding: 1.25rem;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
      }
      .contact-card__top,
      .contact-card__bottom {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .status-badge {
        display: inline-flex;
        margin-bottom: 0.75rem;
        padding: 0.42rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 800;
      }
      .status-pending { background: rgba(212, 175, 122, 0.16); color: var(--accent-strong); }
      .status-contacted { background: rgba(111, 160, 215, 0.16); color: #406b9e; }
      .status-converted { background: rgba(110, 203, 141, 0.18); color: #418b58; }
      .status-rejected { background: rgba(200, 72, 72, 0.14); color: #b54848; }
      .contact-meta {
        text-align: right;
      }
      .message {
        margin: 1rem 0;
        line-height: 1.7;
      }
      .status-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .active-status {
        border-color: rgba(44, 44, 44, 0.2) !important;
        background: rgba(245, 230, 218, 0.7) !important;
      }
      @media (max-width: 760px) {
        .hero-card,
        .contact-card__top,
        .contact-card__bottom {
          display: grid;
        }
        .contact-meta {
          text-align: left;
        }
      }
    `,
  ],
})
export class AdminContactsComponent implements OnInit, OnDestroy {
  contacts = signal<EventContact[]>([]);
  loading = signal(false);
  busyIds = signal<number[]>([]);
  statuses: ContactStatus[] = ['pending', 'contacted', 'converted', 'rejected'];
  private pollId: ReturnType<typeof setInterval> | null = null;

  constructor(private eventsService: EventoService) {}

  ngOnInit(): void {
    this.loadContacts();
    this.pollId = setInterval(() => this.loadContacts(false), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollId) {
      clearInterval(this.pollId);
    }
  }

  loadContacts(showLoader = true): void {
    if (showLoader) {
      this.loading.set(true);
    }

    this.eventsService.getAdminContacts().subscribe({
      next: (contacts) => {
        this.contacts.set(contacts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(contact: EventContact, status: ContactStatus): void {
    this.busyIds.update((ids) => [...ids, contact.id]);
    this.eventsService.updateAdminContactStatus(contact.id, status).subscribe({
      next: (updated) => {
        this.contacts.update((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
        this.busyIds.update((ids) => ids.filter((id) => id !== contact.id));
      },
      error: () => this.busyIds.update((ids) => ids.filter((id) => id !== contact.id)),
    });
  }

  statusLabel(status: ContactStatus): string {
    const labels: Record<ContactStatus, string> = {
      pending: 'Pendiente',
      contacted: 'Contactado',
      converted: 'Convertido',
      rejected: 'Rechazado',
    };

    return labels[status];
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
