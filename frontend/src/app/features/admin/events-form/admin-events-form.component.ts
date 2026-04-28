import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EventSection, EventSectionContent, Evento, GalleryImage } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';

@Component({
  selector: 'app-admin-events-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DragDropModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="form-shell">
      <section class="intro-card">
        <span class="eyebrow">{{ isEditing ? 'Editar evento' : 'Nuevo evento' }}</span>
        <h1>{{ isEditing ? 'Actualiza un evento del portfolio' : 'Crea un evento privado para el panel' }}</h1>
        <p>Guarda primero la base del evento y despues alimenta la galeria con imagenes reales, orden y captions.</p>
      </section>

      <section class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="grid-two">
            <div class="sonic-field">
              <label for="title">Titulo del evento</label>
              <input id="title" formControlName="title" placeholder="Ej. Mesa boda romantica">
              <span class="field-error" *ngIf="form.get('title')?.touched && form.get('title')?.hasError('required')">El titulo es obligatorio</span>
            </div>

            <div class="sonic-field">
              <label for="slug">Slug generado</label>
              <input id="slug" [value]="slugPreview()" disabled>
            </div>

            <div class="sonic-field">
              <label for="category">Categoria</label>
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
              <label for="location">Ubicacion</label>
              <input id="location" formControlName="location" placeholder="Finca, hotel, restaurante...">
            </div>

            <div class="sonic-field">
              <label for="planName">Plan contratado</label>
              <input id="planName" formControlName="planName" placeholder="Ej. Signature Garden">
            </div>
          </div>

          <div class="sonic-field">
            <label for="description">Descripcion</label>
            <textarea id="description" formControlName="description" rows="6" placeholder="Cuenta el ambiente, el montaje y los detalles visuales del evento."></textarea>
          </div>

          <div class="grid-two">
            <div class="sonic-field">
              <label for="planSummary">Resumen del plan</label>
              <textarea id="planSummary" formControlName="planSummary" rows="4" placeholder="Que incluye el plan y por que encaja con este evento."></textarea>
            </div>

            <div class="sonic-field">
              <label for="totalPrice">Precio estimado final</label>
              <input id="totalPrice" type="number" min="0" formControlName="totalPrice" placeholder="0">
            </div>
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

      <section class="gallery-card" *ngIf="isEditing; else saveFirstTpl">
        <div class="gallery-head">
          <div>
            <span class="eyebrow">Galeria</span>
            <h2>Imagenes del evento</h2>
            <p>Sube hasta 5MB por imagen en JPEG, PNG o WebP. Arrastra para reordenar y desactiva las que no quieras mostrar.</p>
          </div>
          <label class="upload-button" [class.upload-button--disabled]="uploading()">
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple (change)="onFilesSelected($event)" [disabled]="uploading()">
            <span>{{ uploading() ? 'Subiendo...' : 'Subir imagenes' }}</span>
          </label>
        </div>

        <p *ngIf="galleryMessage()" class="gallery-message">{{ galleryMessage() }}</p>

        <div *ngIf="uploading()" class="uploading-state">
          <mat-spinner diameter="34"></mat-spinner>
          <span>Procesando archivos...</span>
        </div>

        <div *ngIf="gallery().length === 0" class="gallery-empty">
          <div class="ui-mark">ES</div>
          <p>Este evento todavia no tiene imagenes. Sube la primera para empezar a construir la galeria.</p>
        </div>

        <div
          *ngIf="gallery().length > 0"
          cdkDropList
          class="gallery-grid"
          (cdkDropListDropped)="onGalleryDrop($event)"
        >
          <article *ngFor="let image of gallery(); trackBy: trackByImageId" cdkDrag class="gallery-item" [class.gallery-item--inactive]="!image.isActive">
            <div class="gallery-item__media" [style.background-image]="getImageStyle(image.imageUrl)">
              <button type="button" cdkDragHandle class="drag-handle" aria-label="Reordenar imagen">::</button>
              <span class="status-chip" [class.status-chip--inactive]="!image.isActive">
                {{ image.isActive ? 'Activa' : 'Oculta' }}
              </span>
            </div>

            <div class="gallery-item__body">
              <div class="gallery-item__controls">
                <label class="switch">
                  <input type="checkbox" [checked]="image.isActive" (change)="toggleImage(image, $any($event.target).checked)" [disabled]="busyGalleryIds().includes(image.id)">
                  <span class="switch-ui"></span>
                  <span>{{ image.isActive ? 'Visible' : 'Oculta' }}</span>
                </label>

                <button mat-stroked-button class="danger-button" type="button" (click)="deleteImage(image)" [disabled]="busyGalleryIds().includes(image.id)">Eliminar</button>
              </div>

              <label class="sonic-field">
                <span>Caption</span>
                <input
                  [value]="image.caption || ''"
                  placeholder="Describe la escena, los tonos o el montaje"
                  (blur)="updateCaption(image, $any($event.target).value)"
                >
              </label>
            </div>
          </article>
        </div>
      </section>

      <section class="gallery-card" *ngIf="isEditing">
        <div class="gallery-head">
          <div>
            <span class="eyebrow">Secciones publicas</span>
            <h2>Bloques configurables</h2>
            <p>Activa, desactiva y reordena la narrativa publica del evento. La vista publica solo mostrara las secciones activas.</p>
          </div>
        </div>

        <p *ngIf="sectionsMessage()" class="gallery-message">{{ sectionsMessage() }}</p>

        <div *ngIf="sections().length === 0" class="gallery-empty">
          <div class="ui-mark">ES</div>
          <p>No hay secciones cargadas todavia. Recarga el evento para inicializar la estructura publica.</p>
        </div>

        <div
          *ngIf="sections().length > 0"
          cdkDropList
          class="gallery-grid"
          (cdkDropListDropped)="onSectionsDrop($event)"
        >
          <article *ngFor="let section of sections(); trackBy: trackBySectionId" cdkDrag class="gallery-item" [class.gallery-item--inactive]="!section.isActive">
            <div class="section-summary">
              <button type="button" cdkDragHandle class="drag-handle drag-handle--inline" aria-label="Reordenar seccion">::</button>
              <span class="status-chip" [class.status-chip--inactive]="!section.isActive">
                {{ section.isActive ? 'Activa' : 'Oculta' }}
              </span>
              <strong>{{ sectionLabel(section.type) }}</strong>
              <p>{{ sectionDescription(section.type) }}</p>
            </div>

            <div class="gallery-item__body">
              <div class="gallery-item__controls">
                <label class="switch">
                  <input type="checkbox" [checked]="section.isActive" (change)="toggleSection(section, $any($event.target).checked)" [disabled]="busySectionIds().includes(section.id)">
                  <span class="switch-ui"></span>
                  <span>{{ section.isActive ? 'Visible' : 'Oculta' }}</span>
                </label>
              </div>

              <div class="grid-two grid-two--tight">
                <label class="sonic-field" *ngIf="showSectionField(section.type, 'eyebrow')">
                  <span>Eyebrow</span>
                  <input [value]="section.content.eyebrow || ''" (blur)="updateSectionContent(section, 'eyebrow', $any($event.target).value)">
                </label>

                <label class="sonic-field" *ngIf="showSectionField(section.type, 'title')">
                  <span>Titulo</span>
                  <input [value]="section.content.title || ''" (blur)="updateSectionContent(section, 'title', $any($event.target).value)">
                </label>

                <label class="sonic-field" *ngIf="showSectionField(section.type, 'heading')">
                  <span>Heading</span>
                  <input [value]="section.content.heading || ''" (blur)="updateSectionContent(section, 'heading', $any($event.target).value)">
                </label>

                <label class="sonic-field" *ngIf="showSectionField(section.type, 'planHeading')">
                  <span>Titulo del plan</span>
                  <input [value]="section.content.planHeading || ''" (blur)="updateSectionContent(section, 'planHeading', $any($event.target).value)">
                </label>

                <label class="sonic-field" *ngIf="showSectionField(section.type, 'ctaLabel')">
                  <span>Texto CTA</span>
                  <input [value]="section.content.ctaLabel || ''" (blur)="updateSectionContent(section, 'ctaLabel', $any($event.target).value)">
                </label>
              </div>

              <label class="sonic-field" *ngIf="showSectionField(section.type, 'summary')">
                <span>Resumen</span>
                <textarea rows="3" (blur)="updateSectionContent(section, 'summary', $any($event.target).value)">{{ section.content.summary || '' }}</textarea>
              </label>

              <label class="sonic-field" *ngIf="showSectionField(section.type, 'description')">
                <span>Descripcion</span>
                <textarea rows="3" (blur)="updateSectionContent(section, 'description', $any($event.target).value)">{{ section.content.description || '' }}</textarea>
              </label>

              <label class="sonic-field" *ngIf="showSectionField(section.type, 'body')">
                <span>Cuerpo</span>
                <textarea rows="4" (blur)="updateSectionContent(section, 'body', $any($event.target).value)">{{ section.content.body || '' }}</textarea>
              </label>

              <label class="sonic-field" *ngIf="showSectionField(section.type, 'planSummary')">
                <span>Resumen del plan</span>
                <textarea rows="3" (blur)="updateSectionContent(section, 'planSummary', $any($event.target).value)">{{ section.content.planSummary || '' }}</textarea>
              </label>
            </div>
          </article>
        </div>
      </section>

      <ng-template #saveFirstTpl>
        <section class="gallery-card gallery-card--muted">
          <span class="eyebrow">Galeria</span>
          <h2>Guarda el evento para empezar a subir imagenes</h2>
          <p>Necesitamos el ID del evento antes de aceptar archivos y ordenar la galeria.</p>
        </section>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .form-shell {
        max-width: 1120px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .intro-card,
      .form-card,
      .gallery-card {
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
      .form-card,
      .gallery-card {
        padding: 1.7rem;
        background: rgba(255, 255, 255, 0.88);
      }
      .gallery-card--muted {
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      h1, h2 {
        margin: 0;
        font-family: var(--font-display);
        line-height: 1.08;
      }
      h1 {
        margin: 0.75rem 0 0.5rem;
        font-size: clamp(2.2rem, 4vw, 4rem);
        max-width: 13ch;
      }
      h2 {
        font-size: clamp(1.8rem, 3vw, 2.4rem);
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
      .grid-two--tight {
        gap: 0.75rem;
      }
      .publish-box {
        display: flex;
        gap: 0.9rem;
        align-items: flex-start;
        padding: 1rem 1.1rem;
        border-radius: 22px;
        background: rgba(245, 230, 218, 0.5);
      }
      .publish-box input,
      .switch input {
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
      .gallery-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .upload-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 3rem;
        padding: 0.85rem 1.3rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #d4af7a 0%, #efd8b7 100%);
        color: #221c17;
        font-weight: 800;
        cursor: pointer;
      }
      .upload-button input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }
      .upload-button--disabled {
        opacity: 0.7;
        pointer-events: none;
      }
      .gallery-message {
        margin: 1rem 0 0;
        color: var(--accent-strong);
        font-weight: 700;
      }
      .uploading-state,
      .gallery-empty {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        margin-top: 1rem;
        padding: 1rem 1.1rem;
        border-radius: 22px;
        background: rgba(245, 230, 218, 0.4);
      }
      .gallery-grid {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }
      .gallery-item {
        display: grid;
        grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
        gap: 1rem;
        padding: 1rem;
        border-radius: 24px;
        border: 1px solid rgba(44, 44, 44, 0.08);
        background: linear-gradient(180deg, #ffffff 0%, #faf5ee 100%);
      }
      .gallery-item--inactive {
        opacity: 0.72;
      }
      .gallery-item__media {
        position: relative;
        min-height: 220px;
        border-radius: 22px;
        background:
          linear-gradient(135deg, rgba(212, 175, 122, 0.25), rgba(245, 230, 218, 0.85));
        background-size: cover;
        background-position: center;
        overflow: hidden;
      }
      .drag-handle {
        position: absolute;
        top: 0.8rem;
        left: 0.8rem;
        width: 2.4rem;
        height: 2.4rem;
        padding: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: none;
        font-weight: 900;
        letter-spacing: 0.1em;
      }
      .drag-handle--inline {
        position: static;
      }
      .status-chip {
        position: absolute;
        right: 0.8rem;
        top: 0.8rem;
        display: inline-flex;
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        background: rgba(110, 203, 141, 0.18);
        color: #418b58;
        font-size: 0.8rem;
        font-weight: 800;
      }
      .status-chip--inactive {
        background: rgba(120, 120, 120, 0.16);
        color: #5f5a54;
      }
      .gallery-item__body {
        display: grid;
        gap: 1rem;
        align-content: start;
      }
      .section-summary {
        position: relative;
        display: grid;
        align-content: start;
        gap: 0.6rem;
        min-height: 220px;
        padding: 1rem;
        border-radius: 22px;
        background:
          radial-gradient(circle at top left, rgba(212, 175, 122, 0.25), transparent 36%),
          linear-gradient(180deg, #fffaf3 0%, #f4eadf 100%);
      }
      .section-summary strong {
        margin-top: 2.8rem;
        font-size: 1.15rem;
      }
      .section-summary p {
        margin: 0;
      }
      .gallery-item__controls {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: center;
      }
      .switch {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        font-weight: 700;
      }
      .switch input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }
      .switch-ui {
        position: relative;
        width: 58px;
        height: 32px;
        border-radius: 999px;
        background: rgba(120, 120, 120, 0.24);
        transition: background 0.25s ease;
      }
      .switch-ui::after {
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
      .switch input:checked + .switch-ui {
        background: linear-gradient(135deg, #7cc18d 0%, #5aa872 100%);
      }
      .switch input:checked + .switch-ui::after {
        transform: translateX(26px);
      }
      .danger-button {
        border-color: rgba(200, 72, 72, 0.24) !important;
        color: #b54848 !important;
      }
      @media (max-width: 860px) {
        .grid-two,
        .gallery-item {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .actions,
        .gallery-head,
        .gallery-item__controls {
          display: grid;
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
    planName: ['', Validators.maxLength(120)],
    planSummary: ['', Validators.maxLength(2000)],
    totalPrice: [null as number | null],
    isPublished: [false],
  });
  saving = signal(false);
  uploading = signal(false);
  galleryMessage = signal('');
  gallery = signal<GalleryImage[]>([]);
  busyGalleryIds = signal<number[]>([]);
  sections = signal<EventSection[]>([]);
  sectionsMessage = signal('');
  busySectionIds = signal<number[]>([]);
  currentEvent = signal<Evento | null>(null);
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
      this.loadEvent(this.itemId!);
    }
  }

  loadEvent(eventId: number): void {
    this.eventsService.getAdminEventById(eventId).subscribe((item) => {
      this.currentEvent.set(item);
      this.gallery.set(item.gallery || []);
      this.sections.set((item.sections || []).slice().sort((left, right) => left.order - right.order));
      this.form.patchValue({
        title: item.title,
        category: item.category || 'other',
        eventDate: item.eventDate || '',
        location: item.location || '',
        description: item.description || '',
        planName: item.planName || '',
        planSummary: item.planSummary || '',
        totalPrice: item.totalPrice ?? null,
        isPublished: item.isPublished,
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      title: raw.title?.trim() || '',
      category: raw.category || 'other',
      eventDate: raw.eventDate || undefined,
      location: raw.location?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      planName: raw.planName?.trim() || undefined,
      planSummary: raw.planSummary?.trim() || undefined,
      totalPrice: raw.totalPrice ?? undefined,
      isPublished: !!raw.isPublished,
    };

    const request = this.isEditing
      ? this.eventsService.updateAdminEvent(this.itemId!, payload)
      : this.eventsService.createAdminEvent(payload);

    request.subscribe({
      next: (event) => {
        this.currentEvent.set(event);
        this.gallery.set(event.gallery || []);
        this.sections.set((event.sections || []).slice().sort((left, right) => left.order - right.order));
        this.router.navigate(['/admin/events', event.id, 'edit']);
      },
      error: () => this.saving.set(false),
      complete: () => this.saving.set(false),
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (!this.itemId || files.length === 0) {
      return;
    }

    this.galleryMessage.set('');
    this.uploading.set(true);
    this.eventsService.uploadEventImages(this.itemId, files).subscribe({
      next: (response) => {
        this.currentEvent.set(response.event);
        this.gallery.set(response.gallery);
        this.galleryMessage.set(`${files.length} imagen(es) subidas correctamente.`);
      },
      error: (error) => {
        this.galleryMessage.set(error?.error?.error || 'No se pudieron subir las imagenes.');
        this.uploading.set(false);
      },
      complete: () => {
        this.uploading.set(false);
        input.value = '';
      },
    });
  }

  onGalleryDrop(event: CdkDragDrop<GalleryImage[]>): void {
    if (!this.itemId || event.previousIndex === event.currentIndex) {
      return;
    }

    const reordered = [...this.gallery()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.gallery.set(reordered.map((image, index) => ({ ...image, order: index })));

    this.eventsService.reorderEventGallery(
      this.itemId,
      this.gallery().map((image, index) => ({ id: image.id, order: index }))
    ).subscribe({
      next: (response) => {
        this.currentEvent.set(response.event);
        this.gallery.set(response.gallery);
      },
      error: () => {
        this.galleryMessage.set('No se pudo guardar el nuevo orden de la galeria.');
        this.loadEvent(this.itemId!);
      },
    });
  }

  toggleImage(image: GalleryImage, isActive: boolean): void {
    if (!this.itemId) {
      return;
    }

    this.markGalleryBusy(image.id, true);
    this.eventsService.updateGalleryImage(this.itemId, image.id, { isActive }).subscribe({
      next: (response) => {
        this.currentEvent.set(response.event);
        this.gallery.set(response.gallery);
        this.markGalleryBusy(image.id, false);
      },
      error: () => this.markGalleryBusy(image.id, false),
    });
  }

  updateCaption(image: GalleryImage, value: string): void {
    if (!this.itemId || (image.caption || '') === value.trim()) {
      return;
    }

    this.markGalleryBusy(image.id, true);
    this.eventsService.updateGalleryImage(this.itemId, image.id, { caption: value.trim() }).subscribe({
      next: (response) => {
        this.currentEvent.set(response.event);
        this.gallery.set(response.gallery);
        this.markGalleryBusy(image.id, false);
      },
      error: () => this.markGalleryBusy(image.id, false),
    });
  }

  deleteImage(image: GalleryImage): void {
    if (!this.itemId || !confirm('Eliminar esta imagen de la galeria?')) {
      return;
    }

    this.markGalleryBusy(image.id, true);
    this.eventsService.deleteGalleryImage(this.itemId, image.id).subscribe({
      next: (response) => {
        this.currentEvent.set(response.event);
        this.gallery.set(response.gallery);
        this.markGalleryBusy(image.id, false);
      },
      error: () => this.markGalleryBusy(image.id, false),
    });
  }

  trackByImageId(_index: number, image: GalleryImage): number {
    return image.id;
  }

  trackBySectionId(_index: number, section: EventSection): number {
    return section.id;
  }

  getImageStyle(url: string): string {
    return `url('${this.eventsService.resolveAssetUrl(url)}')`;
  }

  onSectionsDrop(event: CdkDragDrop<EventSection[]>): void {
    if (!this.itemId || event.previousIndex === event.currentIndex) {
      return;
    }

    const reordered = [...this.sections()];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.sections.set(reordered.map((section, index) => ({ ...section, order: index })));

    this.eventsService.reorderEventSections(
      this.itemId,
      this.sections().map((section, index) => ({ id: section.id, order: index }))
    ).subscribe({
      next: (sections) => {
        this.sections.set(sections);
        this.sectionsMessage.set('Orden de secciones actualizado.');
      },
      error: () => {
        this.sectionsMessage.set('No se pudo guardar el nuevo orden de las secciones.');
        this.loadEvent(this.itemId!);
      },
    });
  }

  toggleSection(section: EventSection, isActive: boolean): void {
    if (!this.itemId) {
      return;
    }

    this.markSectionBusy(section.id, true);
    this.eventsService.updateEventSection(this.itemId, section.id, { isActive }).subscribe({
      next: (updated) => {
        this.replaceSection(updated);
        this.sectionsMessage.set(`Seccion ${this.sectionLabel(section.type).toLowerCase()} actualizada.`);
        this.markSectionBusy(section.id, false);
      },
      error: () => this.markSectionBusy(section.id, false),
    });
  }

  updateSectionContent(section: EventSection, key: keyof EventSectionContent, value: string): void {
    if (!this.itemId) {
      return;
    }

    const trimmedValue = value.trim();
    if ((section.content[key] || '') === trimmedValue) {
      return;
    }

    const content: EventSectionContent = {
      ...section.content,
      [key]: trimmedValue,
    };

    this.markSectionBusy(section.id, true);
    this.eventsService.updateEventSection(this.itemId, section.id, { content }).subscribe({
      next: (updated) => {
        this.replaceSection(updated);
        this.sectionsMessage.set(`Contenido de ${this.sectionLabel(section.type).toLowerCase()} guardado.`);
        this.markSectionBusy(section.id, false);
      },
      error: () => this.markSectionBusy(section.id, false),
    });
  }

  sectionLabel(type: EventSection['type']): string {
    switch (type) {
      case 'hero':
        return 'Hero';
      case 'gallery':
        return 'Galeria';
      case 'about':
        return 'Sobre el evento';
      case 'contact':
        return 'Contacto';
      default:
        return type;
    }
  }

  sectionDescription(type: EventSection['type']): string {
    switch (type) {
      case 'hero':
        return 'Portada principal con mensaje y contexto del evento.';
      case 'gallery':
        return 'Bloque visual para las imagenes destacadas del montaje.';
      case 'about':
        return 'Narrativa y detalle del plan, propuesta y extras.';
      case 'contact':
        return 'Formulario y llamada a la accion comercial.';
      default:
        return 'Bloque configurable del evento.';
    }
  }

  showSectionField(type: EventSection['type'], field: keyof EventSectionContent): boolean {
    const visibleFields: Record<EventSection['type'], Array<keyof EventSectionContent>> = {
      hero: ['eyebrow', 'title', 'summary'],
      gallery: ['heading', 'description'],
      about: ['heading', 'body', 'planHeading', 'planSummary'],
      contact: ['eyebrow', 'heading', 'body', 'ctaLabel'],
    };

    return visibleFields[type].includes(field);
  }

  private markGalleryBusy(imageId: number, busy: boolean): void {
    if (busy) {
      this.busyGalleryIds.update((ids) => Array.from(new Set([...ids, imageId])));
      return;
    }

    this.busyGalleryIds.update((ids) => ids.filter((id) => id !== imageId));
  }

  private markSectionBusy(sectionId: number, busy: boolean): void {
    if (busy) {
      this.busySectionIds.update((ids) => Array.from(new Set([...ids, sectionId])));
      return;
    }

    this.busySectionIds.update((ids) => ids.filter((id) => id !== sectionId));
  }

  private replaceSection(updated: EventSection): void {
    this.sections.update((sections) =>
      sections
        .map((section) => (section.id === updated.id ? updated : section))
        .sort((left, right) => left.order - right.order)
    );
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
