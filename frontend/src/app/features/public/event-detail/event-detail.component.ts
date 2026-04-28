import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-public-event-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="detail-shell">
      <div *ngIf="loading()" class="state-card">
        <mat-spinner diameter="42"></mat-spinner>
        <p>Cargando evento...</p>
      </div>

      <ng-container *ngIf="!loading() && item() as event">
        <section class="hero">
          <div class="hero-copy">
            <span class="eyebrow">Evento publicado</span>
            <h1>{{ event.title }}</h1>
            <p>{{ event.description || 'Este evento forma parte del portfolio publico de EventoSonic.' }}</p>
            <div class="hero-meta">
              <span>{{ formatEventDate(event.eventDate) }}</span>
              <span *ngIf="event.planName">{{ event.planName }}</span>
              <span *ngIf="event.location">{{ event.location }}</span>
            </div>
          </div>
          <a mat-raised-button color="primary" routerLink="/" fragment="contacto">Solicitar presupuesto general</a>
        </section>

        <section class="content-grid">
          <article class="story-card">
            <h2>La propuesta</h2>
            <p>{{ event.description || 'Sin descripcion ampliada.' }}</p>

            <div *ngIf="event.planSummary" class="plan-card">
              <span class="eyebrow">Plan contratado</span>
              <h3>{{ event.planName || 'Plan EventoSonic' }}</h3>
              <p>{{ event.planSummary }}</p>
              <strong *ngIf="event.totalPrice">{{ event.totalPrice | currency:'EUR':'symbol':'1.0-0' }}</strong>
            </div>

            <div *ngIf="event.selectedExtras?.length" class="extras-card">
              <h3>Extras incluidos</h3>
              <div class="extra-row" *ngFor="let extra of event.selectedExtras">
                <span>{{ extra.name }}</span>
                <strong>{{ extra.price | currency:'EUR':'symbol':'1.0-0' }}</strong>
              </div>
            </div>
          </article>

          <article class="gallery-card">
            <div class="main-image" [style.background-image]="selectedImage() ? 'url(' + selectedImage() + ')' : getCoverStyle(event)"></div>
            <div class="thumb-grid" *ngIf="galleryImages(event).length > 0">
              <button type="button" *ngFor="let image of galleryImages(event)" class="thumb-button" (click)="updateSelectedImage(event, image)">
                <span [style.background-image]="'url(' + image + ')'"></span>
              </button>
            </div>
            <p *ngIf="selectedCaption()" class="caption-note">{{ selectedCaption() }}</p>
            <a mat-stroked-button routerLink="/eventos">Volver a eventos</a>
          </article>
        </section>

        <section class="contact-card">
          <div class="contact-head">
            <div>
              <span class="eyebrow">Solicitar informacion</span>
              <h2>¿Te interesa este montaje?</h2>
              <p>Envia tu solicitud y la guardaremos directamente en el panel de administracion del evento.</p>
            </div>
          </div>

          <form [formGroup]="contactForm" (ngSubmit)="submitContact()">
            <div class="grid-two">
              <div class="sonic-field">
                <label for="contact-name">Nombre</label>
                <input id="contact-name" formControlName="name" placeholder="Tu nombre">
              </div>

              <div class="sonic-field">
                <label for="contact-email">Email</label>
                <input id="contact-email" formControlName="email" type="email" placeholder="cliente@evento.com">
              </div>

              <div class="sonic-field">
                <label for="contact-phone">Telefono</label>
                <input id="contact-phone" formControlName="phone" placeholder="+34 600 000 000">
              </div>
            </div>

            <div class="sonic-field">
              <label for="contact-message">Mensaje</label>
              <textarea id="contact-message" formControlName="message" rows="5" placeholder="Cuéntanos qué necesitas, fecha estimada y estilo del evento."></textarea>
            </div>

            <p *ngIf="contactError()" class="error-text">{{ contactError() }}</p>
            <p *ngIf="contactSuccess()" class="success-text">{{ contactSuccess() }}</p>

            <div class="contact-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="contactForm.invalid || sendingContact()">
                {{ sendingContact() ? 'Enviando...' : 'Enviar solicitud' }}
              </button>
            </div>
          </form>
        </section>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .detail-shell {
        width: var(--container);
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .hero,
      .story-card,
      .gallery-card,
      .contact-card,
      .state-card,
      .plan-card,
      .extras-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .hero {
        min-height: 360px;
        padding: clamp(2rem, 5vw, 3rem);
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        background:
          linear-gradient(120deg, rgba(30, 26, 20, 0.8), rgba(30, 26, 20, 0.42)),
          radial-gradient(circle at top right, rgba(212, 175, 122, 0.28), transparent 26%);
        color: #fffaf6;
      }
      h1, h2, h3 {
        margin: 0;
        font-family: var(--font-display);
        line-height: 1.08;
      }
      h1 {
        margin: 0.75rem 0 0.9rem;
        font-size: clamp(2.6rem, 6vw, 5rem);
        max-width: 12ch;
      }
      h2 {
        margin-bottom: 1rem;
        font-size: 2.2rem;
      }
      h3 {
        margin-bottom: 0.55rem;
        font-size: 1.6rem;
      }
      .hero-copy {
        max-width: 48rem;
      }
      .hero p,
      .story-card p,
      .plan-card p {
        color: inherit;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        margin-top: 1.2rem;
      }
      .hero-meta span {
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: rgba(255, 250, 245, 0.14);
      }
      .content-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 0.95fr);
        gap: 1rem;
      }
      .story-card,
      .gallery-card,
      .contact-card {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.88);
      }
      .story-card > p {
        color: var(--text-soft);
        line-height: 1.75;
      }
      .plan-card,
      .extras-card {
        margin-top: 1.2rem;
        padding: 1.1rem;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f0e8 100%);
      }
      .plan-card strong {
        display: inline-flex;
        margin-top: 0.65rem;
        padding: 0.45rem 0.8rem;
        border-radius: 999px;
        background: rgba(212, 175, 122, 0.14);
        color: var(--accent-strong);
      }
      .extra-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(44, 44, 44, 0.07);
      }
      .extra-row:last-child {
        border-bottom: 0;
      }
      .main-image {
        min-height: 420px;
        border-radius: 26px;
        background:
          linear-gradient(135deg, rgba(212, 175, 122, 0.25), rgba(245, 230, 218, 0.85));
        background-size: cover;
        background-position: center;
      }
      .thumb-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }
      .thumb-button {
        padding: 0;
        background: transparent;
        box-shadow: none;
      }
      .thumb-button span {
        display: block;
        min-height: 88px;
        border-radius: 18px;
        background-size: cover;
        background-position: center;
      }
      .contact-head p,
      .caption-note {
        color: var(--text-soft);
      }
      form {
        display: grid;
        gap: 1rem;
      }
      .grid-two {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .contact-actions {
        display: flex;
        justify-content: flex-start;
      }
      .success-text {
        color: #418b58;
        font-weight: 700;
      }
      .error-text {
        color: #b54848;
        font-weight: 700;
      }
      .state-card {
        min-height: 260px;
        display: grid;
        place-items: center;
        gap: 0.85rem;
        text-align: center;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      @media (max-width: 980px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .hero,
        .grid-two {
          display: grid;
        }
        .thumb-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PublicEventDetailComponent implements OnInit {
  item = signal<Evento | null>(null);
  loading = signal(false);
  sendingContact = signal(false);
  contactSuccess = signal('');
  contactError = signal('');
  selectedImage = signal<string | null>(null);
  selectedCaption = signal<string>('');
  contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor(
    private fb: FormBuilder,
    private eventsService: EventoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/eventos']);
      return;
    }

    this.loading.set(true);
    this.eventsService.getPublicEventBySlug(slug).subscribe({
      next: (event) => {
        this.item.set(event);
        const firstImage = event.gallery?.[0]?.imageUrl || event.coverImage || event.images?.[0] || null;
        this.selectedImage.set(firstImage ? this.eventsService.resolveAssetUrl(firstImage) : null);
        this.selectedCaption.set(event.gallery?.[0]?.caption || '');
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/eventos']);
      },
    });
  }

  submitContact(): void {
    if (this.contactForm.invalid || !this.item()) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.sendingContact.set(true);
    this.contactSuccess.set('');
    this.contactError.set('');

    this.eventsService.createPublicEventContact(this.item()!.slug, this.contactForm.getRawValue() as any).subscribe({
      next: () => {
        this.contactSuccess.set('Solicitud enviada correctamente. Te contactaremos pronto.');
        this.contactForm.reset({ name: '', email: '', phone: '', message: '' });
      },
      error: (error) => {
        this.contactError.set(error?.error?.error || 'No se pudo enviar la solicitud.');
      },
      complete: () => this.sendingContact.set(false),
    });
  }

  galleryImages(event: Evento): string[] {
    const gallery = (event.gallery || [])
      .filter((image) => image.isActive)
      .sort((left, right) => left.order - right.order);

    if (gallery.length > 0) {
      return gallery.map((image) => this.eventsService.resolveAssetUrl(image.imageUrl));
    }

    const images = event.images || [];
    if (event.coverImage && !images.includes(event.coverImage)) {
      return [this.eventsService.resolveAssetUrl(event.coverImage), ...images.map((image) => this.eventsService.resolveAssetUrl(image))];
    }
    return images.map((image) => this.eventsService.resolveAssetUrl(image));
  }

  getCoverStyle(event: Evento): string {
    const image = event.coverImage || event.images?.[0];
    return image ? `url('${this.eventsService.resolveAssetUrl(image)}')` : '';
  }

  updateSelectedImage(event: Evento, imageUrl: string): void {
    this.selectedImage.set(imageUrl);
    const match = (event.gallery || []).find(
      (image) => this.eventsService.resolveAssetUrl(image.imageUrl) === imageUrl
    );
    this.selectedCaption.set(match?.caption || '');
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
}
