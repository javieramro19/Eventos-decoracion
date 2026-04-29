import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Evento, PlanSelectionExtra } from '../../../core/models/event.model';
import { EventoService } from '../../../core/services/events.service';
import { PLAN_EXTRAS, PLANS, PlanCard, PlanExtra } from '../../plans/plans.data';

@Component({
  selector: 'app-client-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="client-editor">
      <section class="editor-head">
        <div>
          <span class="eyebrow">Mi solicitud</span>
          <h1>Editar plan enviado</h1>
          <p>Ajusta extras, fecha, ubicacion y nota personalizada. La confirmacion final depende del admin.</p>
        </div>
        <a mat-stroked-button routerLink="/dashboard">Volver a solicitudes</a>
      </section>

      <section *ngIf="loading()" class="state-card">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Cargando solicitud...</p>
      </section>

      <section *ngIf="!loading() && event() && selectedPlan()" class="editor-card">
        <div class="plan-glance">
          <div>
            <span class="eyebrow">Plan elegido</span>
            <h2>{{ selectedPlan()!.name }}</h2>
            <p>{{ selectedPlan()!.description }}</p>
          </div>
          <div class="status-panel">
            <span>Estado</span>
            <strong>{{ planStatusLabel(event()!) }}</strong>
          </div>
        </div>

        <div class="included-card">
          <h3>Incluye de base</h3>
          <ul>
            <li *ngFor="let item of selectedPlan()!.includes">{{ item }}</li>
          </ul>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()">
          <label class="sonic-field">
            <span>Nombre de la solicitud</span>
            <input formControlName="title" placeholder="Ej. Boda Ana y David">
          </label>

          <div class="grid-two">
            <label class="sonic-field">
              <span>Fecha estimada</span>
              <input type="date" formControlName="eventDate">
            </label>

            <label class="sonic-field">
              <span>Ubicacion</span>
              <input formControlName="location" placeholder="Finca, salon, ciudad...">
            </label>
          </div>

          <section class="extras-card">
            <div class="extras-head">
              <div>
                <h3>Extras del plan</h3>
                <p>Marca o quita extras y el precio estimado se actualizara al momento.</p>
              </div>
              <strong>{{ extrasTotal() | currency:'EUR':'symbol':'1.0-0' }}</strong>
            </div>

            <div class="extras-grid">
              <label class="extra-row" *ngFor="let extra of extras">
                <input type="checkbox" [checked]="isSelected(extra.id)" (change)="toggleExtra(extra, $any($event.target).checked)">
                <div>
                  <strong>{{ extra.name }}</strong>
                  <p>{{ extra.detail }}</p>
                </div>
                <span>+{{ extra.price | number:'1.0-0' }} EUR</span>
              </label>
            </div>
          </section>

          <label class="sonic-field">
            <span>Peticion personalizada</span>
            <textarea formControlName="customExtraNote" rows="5" placeholder="Colores, materiales, ambiente o cualquier detalle adicional."></textarea>
          </label>

          <div class="summary-strip" *ngIf="event() as item">
            <div>
              <span>Plan base</span>
              <strong>{{ planBasePrice() | currency:'EUR':'symbol':'1.0-0' }}</strong>
            </div>
            <div>
              <span>Estado publico</span>
              <strong>{{ item.isPublished ? 'Publicado' : 'Privado' }}</strong>
            </div>
            <div>
              <span>Total estimado</span>
              <strong>{{ totalPrice() | currency:'EUR':'symbol':'1.0-0' }}</strong>
            </div>
          </div>

          <p *ngIf="message()" class="message">{{ message() }}</p>

          <div class="actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar solicitud' }}
            </button>
            <button mat-stroked-button type="button" class="danger-button" (click)="remove()" [disabled]="saving()">Eliminar solicitud</button>
          </div>
        </form>
      </section>
    </div>
  `,
  styles: [
    `
      .client-editor {
        width: var(--container);
        margin: 0 auto;
        display: grid;
        gap: 1rem;
      }
      .editor-head,
      .editor-card,
      .state-card,
      .included-card,
      .extras-card {
        border: 1px solid var(--border);
        border-radius: 18px;
        box-shadow: var(--shadow-sm);
        background: rgba(255, 255, 255, 0.92);
      }
      .editor-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        padding: 1.5rem;
      }
      .editor-card {
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
      }
      .plan-glance {
        display: grid;
        grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.6fr);
        gap: 1rem;
        padding: 1.2rem;
        border-radius: 16px;
        background: rgba(245, 230, 218, 0.4);
      }
      .status-panel {
        padding: 1rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.7);
      }
      h1, h2, h3 {
        margin: 0;
        font-family: var(--font-display);
      }
      h1 {
        margin-top: 0.35rem;
        font-size: 2.2rem;
        line-height: 1.1;
      }
      h2 {
        margin-top: 0.25rem;
        font-size: 2rem;
      }
      p {
        margin: 0;
        color: var(--text-soft);
      }
      form {
        display: grid;
        gap: 1rem;
      }
      .grid-two,
      .summary-strip {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      .summary-strip {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .summary-strip div,
      .included-card,
      .extras-card {
        padding: 1rem;
      }
      .summary-strip div {
        border-radius: 14px;
        background: rgba(245, 230, 218, 0.45);
      }
      .summary-strip span,
      .status-panel span {
        display: block;
        color: var(--muted);
        font-size: 0.82rem;
        text-transform: uppercase;
        font-weight: 800;
      }
      .summary-strip strong,
      .status-panel strong {
        display: block;
        margin-top: 0.3rem;
      }
      ul {
        margin: 0.8rem 0 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.55rem;
      }
      li {
        position: relative;
        padding-left: 1.4rem;
        color: var(--text-soft);
      }
      li::before {
        content: '\\2713';
        position: absolute;
        left: 0;
        color: var(--accent-strong);
        font-weight: 800;
      }
      .extras-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        margin-bottom: 0.9rem;
      }
      .extras-grid {
        display: grid;
        gap: 0.75rem;
      }
      .extra-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.8rem;
        padding: 1rem;
        border-radius: 16px;
        border: 1px solid rgba(44, 44, 44, 0.07);
        background: rgba(255, 255, 255, 0.88);
      }
      .extra-row input {
        margin-top: 0.35rem;
        width: auto;
        accent-color: var(--accent-strong);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: flex-end;
      }
      .message {
        color: var(--accent-strong);
        font-weight: 800;
      }
      .danger-button {
        border-color: rgba(200, 72, 72, 0.24) !important;
        color: #b54848 !important;
      }
      .state-card {
        min-height: 220px;
        display: grid;
        place-items: center;
        gap: 0.75rem;
      }
      @media (max-width: 760px) {
        .editor-head,
        .grid-two,
        .summary-strip,
        .plan-glance,
        .extra-row,
        .extras-head {
          grid-template-columns: 1fr;
          display: grid;
        }
      }
    `,
  ],
})
export class ClientEventFormComponent implements OnInit {
  event = signal<Evento | null>(null);
  loading = signal(false);
  saving = signal(false);
  message = signal('');
  selectedPlan = signal<PlanCard | null>(null);
  selectedExtras = signal<PlanSelectionExtra[]>([]);
  extras: PlanExtra[] = PLAN_EXTRAS;

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(160)]],
    eventDate: [''],
    location: ['', Validators.maxLength(255)],
    customExtraNote: ['', Validators.maxLength(2000)],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loading.set(true);
    this.eventsService.getClientEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.selectedPlan.set(PLANS.find((plan) => plan.id === event.planId) || null);
        this.selectedExtras.set(event.selectedExtras || []);
        this.form.patchValue({
          title: event.title || '',
          eventDate: this.toDateInputValue(event.eventDate),
          location: event.location || '',
          customExtraNote: event.customExtraNote || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
    });
  }

  isSelected(extraId: string): boolean {
    return this.selectedExtras().some((extra) => extra.id === extraId);
  }

  toggleExtra(extra: PlanExtra, checked: boolean): void {
    const current = this.selectedExtras();
    if (checked) {
      this.selectedExtras.set([...current, { ...extra }]);
      return;
    }

    this.selectedExtras.set(current.filter((item) => item.id !== extra.id));
  }

  planBasePrice(): number {
    return this.selectedPlan()?.basePrice || this.event()?.basePrice || 0;
  }

  extrasTotal(): number {
    return this.selectedExtras().reduce((sum, extra) => sum + extra.price, 0);
  }

  totalPrice(): number {
    return this.planBasePrice() + this.extrasTotal();
  }

  save(): void {
    const current = this.event();
    if (!current) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Pon un nombre a la solicitud antes de guardarla.');
      return;
    }

    this.saving.set(true);
    this.message.set('');
    const raw = this.form.getRawValue();

    this.eventsService.updateClientEvent(current.id, {
      title: raw.title?.trim() || current.title,
      eventDate: raw.eventDate || undefined,
      location: raw.location?.trim() || undefined,
      description: this.selectedPlan()?.description || current.description || undefined,
      planId: current.planId,
      planName: this.selectedPlan()?.name || current.planName,
      planSummary: this.selectedPlan()?.summary || current.planSummary,
      basePrice: this.planBasePrice(),
      extrasTotal: this.extrasTotal(),
      totalPrice: this.totalPrice(),
      customExtraNote: raw.customExtraNote?.trim() || undefined,
      selectedExtras: this.selectedExtras(),
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.message.set('No se pudieron guardar los cambios.');
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  remove(): void {
    const current = this.event();
    if (!current || !confirm('Eliminar esta solicitud?')) {
      return;
    }

    this.saving.set(true);
    this.eventsService.deleteClientEvent(current.id).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.message.set('No se pudo eliminar la solicitud.');
        this.saving.set(false);
      },
    });
  }

  planStatusLabel(event: Evento): string {
    if (event.status === 'approved') {
      return event.isPublished ? 'Publicado' : 'Confirmado';
    }

    if (event.status === 'rejected') {
      return 'Solicitud denegada';
    }

    return 'Pendiente de confirmacion';
  }

  private toDateInputValue(value?: string | null): string {
    return value ? value.slice(0, 10) : '';
  }
}
