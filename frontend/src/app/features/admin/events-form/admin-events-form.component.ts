import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-admin-events-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule],
  template: `
    <div class="form-shell">
      <section class="intro-card">
        <span class="eyebrow">{{ isEditing ? 'Editar evento' : 'Nuevo evento' }}</span>
        <h1>{{ isEditing ? 'Actualiza un evento del portfolio' : 'Crea un evento privado para el panel' }}</h1>
        <p>El slug se regenera desde el título y puedes decidir si el proyecto sale publicado o permanece como borrador.</p>
      </section>

      <section class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="grid-two">
            <div class="sonic-field">
              <label for="title">Título del evento</label>
              <input id="title" formControlName="title" placeholder="Ej. Mesa boda romantica">
              <span class="field-error" *ngIf="form.get('title')?.touched && form.get('title')?.hasError('required')">El titulo es obligatorio</span>
            </div>

            <div class="sonic-field">
              <label for="slug">Slug generado</label>
              <input id="slug" [value]="slugPreview()" disabled>
            </div>

            <div class="sonic-field">
              <label for="category">Categoría</label>
              <select id="category" formControlName="category">
                <option value="wedding">Boda</option>
                <option value="birthday">Cumpleanos</option>
                <option value="corporate">Corporativo</option>
                <option value="baptism">Bautizo</option>
                <option value="communion">Comunion</option>
                <option value="other">Otros</option>
              </select>
            </div>

            <div class="sonic-field">
              <label for="eventDate">Fecha</label>
              <input id="eventDate" type="date" formControlName="eventDate">
            </div>

            <div class="sonic-field">
              <label for="location">Ubicación</label>
              <input id="location" formControlName="location" placeholder="Finca, hotel, restaurante...">
            </div>

            <div class="sonic-field">
              <label for="coverImage">Imagen principal</label>
              <input id="coverImage" formControlName="coverImage" placeholder="https://...">
            </div>
          </div>

          <div class="sonic-field">
            <label for="description">Descripción</label>
            <textarea id="description" formControlName="description" rows="6" placeholder="Cuenta el ambiente, el montaje y los detalles visuales del evento."></textarea>
          </div>

          <div class="grid-two">
            <div class="sonic-field">
              <label for="planName">Plan contratado</label>
              <input id="planName" formControlName="planName" placeholder="Ej. Signature Garden">
            </div>

            <div class="sonic-field">
              <label for="totalPrice">Precio estimado final</label>
              <input id="totalPrice" type="number" min="0" formControlName="totalPrice" placeholder="0">
            </div>
          </div>

          <div class="sonic-field">
            <label for="planSummary">Resumen del plan</label>
            <textarea id="planSummary" formControlName="planSummary" rows="4" placeholder="Que incluye el plan y por que encaja con este evento."></textarea>
          </div>

          <div class="sonic-field">
            <label for="images">Galería de imágenes</label>
            <textarea id="images" formControlName="imagesText" rows="5" placeholder="Una URL por linea"></textarea>
            <span class="field-hint">La primera URL se usa como apoyo visual si no indicas imagen principal.</span>
          </div>

          <label class="publish-box">
            <input type="checkbox" formControlName="isPublished">
            <div>
              <strong>Publicar evento</strong>
              <span>Si esta activo, aparecera en la ruta publica /eventos.</span>
            </div>
          </label>

          <div class="actions">
            <a mat-stroked-button routerLink="/admin/events">Cancelar</a>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Guardando...' : isEditing ? 'Actualizar evento' : 'Crear evento' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .form-shell {
        max-width: 1080px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .intro-card,
      .form-card {
        border-radius: 32px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .intro-card {
        padding: 2rem;
        background:
          radial-gradient(circle at top left, rgba(212, 175, 122, 0.2), transparent 25%),
          linear-gradient(135deg, #fbf5ee 0%, #efe5da 100%);
      }
      .form-card {
        padding: 1.7rem;
        background: rgba(255, 255, 255, 0.88);
      }
      h1 {
        margin: 0.75rem 0 0.5rem;
        font-family: var(--font-display);
        font-size: clamp(2.2rem, 4vw, 4rem);
        line-height: 1.08;
        max-width: 13ch;
      }
      p {
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
      .publish-box {
        display: flex;
        gap: 0.9rem;
        align-items: flex-start;
        padding: 1rem 1.1rem;
        border-radius: 22px;
        background: rgba(245, 230, 218, 0.5);
      }
      .publish-box input {
        width: auto;
        margin-top: 0.2rem;
        accent-color: var(--accent-strong);
      }
      .publish-box strong {
        display: block;
        margin-bottom: 0.2rem;
      }
      .publish-box span {
        color: var(--text-soft);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
      @media (max-width: 760px) {
        .grid-two {
          grid-template-columns: 1fr;
        }
        .actions {
          flex-direction: column-reverse;
        }
      }
    `,
  ],
})
export class AdminEventsFormComponent implements OnInit {
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    category: ['other', Validators.required],
    eventDate: [''],
    location: [''],
    description: ['', Validators.maxLength(2000)],
    coverImage: ['', Validators.maxLength(500)],
    imagesText: [''],
    planName: ['', Validators.maxLength(120)],
    planSummary: ['', Validators.maxLength(2000)],
    totalPrice: [null as number | null],
    isPublished: [false],
  });
  saving = signal(false);
  isEditing = false;
  itemId?: number;
  slugPreview = computed(() => this.generateSlug(this.form.get('title')?.value || ''));

  constructor(
    private fb: FormBuilder,
    private eventsService: EventoService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.itemId = Number(this.route.snapshot.params['id']);
    this.isEditing = !!this.itemId;

    if (this.isEditing) {
      this.eventsService.getAdminEventById(this.itemId!).subscribe((item) => {
        this.form.patchValue({
          title: item.title,
          category: item.category || 'other',
          eventDate: item.eventDate || '',
          location: item.location || '',
          description: item.description || '',
          coverImage: item.coverImage || '',
          imagesText: (item.images || []).join('\n'),
          planName: item.planName || '',
          planSummary: item.planSummary || '',
          totalPrice: item.totalPrice ?? null,
          isPublished: item.isPublished,
        });
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const images = String(raw.imagesText || '')
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      title: raw.title?.trim() || '',
      category: raw.category || 'other',
      eventDate: raw.eventDate || undefined,
      location: raw.location?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      coverImage: raw.coverImage?.trim() || undefined,
      images,
      planName: raw.planName?.trim() || undefined,
      planSummary: raw.planSummary?.trim() || undefined,
      totalPrice: raw.totalPrice ?? undefined,
      isPublished: !!raw.isPublished,
    };

    const request = this.isEditing
      ? this.eventsService.updateAdminEvent(this.itemId!, payload)
      : this.eventsService.createAdminEvent(payload);

    request.subscribe({
      next: (event) => this.router.navigate(['/admin/events', event.id, 'edit']),
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  private generateSlug(value: string): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'evento';
  }
}
