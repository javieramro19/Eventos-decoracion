import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-events-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, RouterModule],
  template: `
    <div class="form-page">
      <section class="intro-card">
        <span class="eyebrow">{{ isEditing ? 'Editar evento' : 'Nuevo evento' }}</span>
        <h1>{{ isEditing ? 'Actualiza la propuesta de EventoSonic' : 'Crea un nuevo evento decorativo' }}</h1>
        <p>Añade la información clave para que el equipo y el cliente entiendan el tipo de celebración, ubicación y estilo general.</p>
      </section>

      <section class="form-container">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="sonic-field">
              <label for="title">Título del evento</label>
              <input id="title" formControlName="title" placeholder="Ej. Boda romántica en finca">
              <span class="field-error" *ngIf="form.get('title')?.touched && form.get('title')?.hasError('required')">El título es obligatorio</span>
              <span class="field-error" *ngIf="form.get('title')?.touched && form.get('title')?.hasError('minlength')">Debe tener al menos 3 caracteres</span>
            </div>

            <div class="sonic-field">
              <label for="category">Categoría</label>
              <select id="category" formControlName="category">
                <option value="wedding">Boda</option>
                <option value="birthday">Cumpleaños</option>
                <option value="corporate">Corporativo</option>
                <option value="baptism">Bautizo</option>
                <option value="communion">Comunión</option>
                <option value="other">Otros</option>
              </select>
            </div>

            <div class="sonic-field">
              <label for="eventDate">Fecha del evento</label>
              <input id="eventDate" formControlName="eventDate" type="date">
            </div>

            <div class="sonic-field">
              <label for="location">Lugar</label>
              <input id="location" formControlName="location" placeholder="Ej. Hotel Mirador, Madrid">
            </div>
          </div>

          <div class="sonic-field">
            <label for="description">Descripción</label>
            <textarea id="description" formControlName="description" rows="7" placeholder="Describe la atmósfera, paleta de color, necesidades del montaje o extras deseados."></textarea>
            <span class="field-error" *ngIf="form.get('description')?.touched && form.get('description')?.hasError('maxlength')">Máximo 2000 caracteres</span>
          </div>

          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="cancel()">Cancelar</button>
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
      .form-page {
        max-width: 1080px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .intro-card, .form-container {
        border-radius: 34px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
      }
      .intro-card {
        padding: 2rem;
        background:
          radial-gradient(circle at top left, rgba(202, 170, 145, 0.22), transparent 26%),
          linear-gradient(135deg, #fbf5ee 0%, #efe6dc 100%);
      }
      .eyebrow {
        color: var(--accent-strong);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.74rem;
        font-weight: 800;
      }
      h1 {
        margin: 0.7rem 0 0.5rem;
        font-family: var(--font-display);
        font-size: clamp(2.4rem, 4vw, 4.6rem);
        line-height: 1.08;
        max-width: 10ch;
      }
      p { color: var(--text-soft); }
      .form-container {
        padding: 1.8rem;
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
      }
      form {
        display: grid;
        gap: 1.1rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.25rem;
      }
      @media (max-width: 760px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        .form-actions {
          flex-direction: column-reverse;
        }
      }
    `,
  ],
})
export class EventoFormComponent implements OnInit {
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    category: ['other'],
    eventDate: [''],
    location: [''],
    description: ['', Validators.maxLength(2000)],
  });
  saving = signal(false);
  isEditing = false;
  itemId?: number;

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
      this.eventsService.getById(this.itemId!).subscribe(item => {
        this.form.patchValue({
          title: item.title,
          category: item.category || 'other',
          eventDate: item.eventDate || '',
          location: item.location || '',
          description: item.description || '',
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
    const data = this.form.getRawValue();
    const request = this.isEditing
      ? this.eventsService.update(this.itemId!, data)
      : this.eventsService.create(data);

    request.subscribe({
      next: () => this.router.navigate(['/events']),
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  cancel(): void {
    this.router.navigate(['/events']);
  }
}
