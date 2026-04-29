import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/events.service';
import { PlanDraftService } from '../../../core/services/plan-draft.service';
import { PLAN_EXTRAS, PLANS, PlanCard, PlanExtra } from '../plans.data';

@Component({
  selector: 'app-plan-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatButtonModule],
  template: `
    <div class="plan-page" *ngIf="plan(); else notFoundTpl">
      <section class="plan-hero">
        <div>
          <span class="eyebrow">Configuracion de plan</span>
          <h1>{{ plan()!.name }}</h1>
          <p>{{ plan()!.description }}</p>
          <p class="plan-summary">{{ plan()!.summary }}</p>
        </div>
        <a mat-stroked-button routerLink="/" fragment="planes">Volver a planes</a>
      </section>

      <section class="plan-layout">
        <article class="plan-block">
          <h2>Caracteristicas incluidas</h2>
          <ul>
            <li *ngFor="let item of plan()!.includes">{{ item }}</li>
          </ul>
        </article>

        <article class="plan-block">
          <h2>Extras opcionales</h2>
          <p class="block-copy">Marca los extras que quieras anadir. El precio final se actualiza automaticamente.</p>
          <div class="extras-grid">
            <label class="extra-card" *ngFor="let extra of extras">
              <input type="checkbox" [checked]="isSelected(extra.id)" (change)="toggleExtra(extra.id, $any($event.target).checked)">
              <div>
                <strong>{{ extra.name }}</strong>
                <p>{{ extra.detail }}</p>
              </div>
              <span>+{{ extra.price | number:'1.0-0' }} EUR</span>
            </label>
          </div>
        </article>
      </section>

      <section class="custom-section">
        <h2>Nombre de tu solicitud</h2>
        <p class="block-copy">Pon el nombre con el que quieres identificar este montaje en tu panel y en la revision del admin.</p>
        <div class="sonic-field">
          <label for="event-title">Nombre de la solicitud</label>
          <input id="event-title" [(ngModel)]="eventTitle" placeholder="Ej. Boda Ana y David">
        </div>
      </section>

      <section class="custom-section">
        <h2>Extra personalizado</h2>
        <p class="block-copy">Si necesitas algo diferente a la lista, describelo aqui para incluirlo en tu propuesta.</p>
        <div class="sonic-field">
          <label for="custom-extra">Descripcion del extra personalizado</label>
          <textarea id="custom-extra" rows="6" [(ngModel)]="customExtraNote" placeholder="Ej. Mesa dulce tematica inspirada en naturaleza con tonos crema, verde salvia y piezas artesanales."></textarea>
        </div>
      </section>

      <section class="summary-card">
        <h2>Resumen del plan</h2>
        <div class="summary-lines">
          <div>
            <span>Plan base</span>
            <strong>{{ plan()!.basePrice | number:'1.0-0' }} EUR</strong>
          </div>
          <div>
            <span>Extras seleccionados</span>
            <strong>{{ extrasTotal() | number:'1.0-0' }} EUR</strong>
          </div>
          <div class="total-line">
            <span>Precio estimado final</span>
            <strong>{{ totalPrice() | number:'1.0-0' }} EUR</strong>
          </div>
        </div>

        <button mat-raised-button color="primary" type="button" [disabled]="saving()" (click)="confirmPlan()">
          {{ saving() ? 'Guardando...' : authService.isAuthenticated() ? 'Confirmar y guardar en mi panel' : 'Crear cuenta y confirmar plan' }}
        </button>
        <p *ngIf="feedback()" class="success-note">{{ feedback() }}</p>
      </section>
    </div>

    <ng-template #notFoundTpl>
      <section class="not-found">
        <h1>Plan no encontrado</h1>
        <p>No hemos podido cargar el plan solicitado.</p>
        <a mat-raised-button color="primary" routerLink="/" fragment="planes">Volver a planes</a>
      </section>
    </ng-template>
  `,
  styles: [
    `
      .plan-page {
        width: var(--container);
        margin: 0 auto;
        display: grid;
        gap: 1.25rem;
      }
      .plan-hero, .plan-block, .custom-section, .summary-card, .not-found {
        border-radius: 30px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.88);
        box-shadow: var(--shadow-md);
      }
      .plan-hero {
        padding: 2rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        background:
          radial-gradient(circle at top left, rgba(255, 255, 255, 0.55), transparent 35%),
          linear-gradient(135deg, rgba(212, 175, 122, 0.42), rgba(245, 230, 218, 0.9));
      }
      h1, h2, strong {
        font-family: var(--font-display);
      }
      h1 {
        margin: 0.6rem 0;
        font-size: clamp(2.1rem, 4vw, 3.6rem);
        line-height: 1.08;
      }
      h2 {
        margin: 0 0 0.85rem;
        font-size: 2rem;
        line-height: 1.08;
      }
      p, li, .block-copy, span {
        color: var(--text-soft);
      }
      .plan-summary {
        margin: 0;
        max-width: 68ch;
      }
      .plan-layout {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        gap: 1.25rem;
      }
      .plan-block, .custom-section, .summary-card {
        padding: 1.6rem;
      }
      ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 0.65rem;
      }
      li {
        position: relative;
        padding-left: 1.5rem;
      }
      li::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: var(--accent-strong);
        font-weight: 800;
      }
      .extras-grid {
        display: grid;
        gap: 0.75rem;
      }
      .extra-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.75rem;
        padding: 1.2rem;
        border-radius: 22px;
        border: 1px solid rgba(44, 44, 44, 0.08);
        background: rgba(255, 255, 255, 0.82);
        align-items: flex-start;
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .extra-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 30px rgba(44, 44, 44, 0.09);
      }
      .extra-card input {
        margin-top: 0.35rem;
        width: auto;
        accent-color: var(--accent-strong);
      }
      .extra-card strong {
        font-size: 1.05rem;
      }
      .extra-card p {
        margin: 0.25rem 0 0;
      }
      .extra-card:has(input:checked) {
        border-color: rgba(212, 175, 122, 0.65);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(245, 230, 218, 0.72));
      }
      .summary-lines {
        display: grid;
        gap: 0.55rem;
        margin: 0.4rem 0 1rem;
      }
      .summary-lines div {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .total-line {
        margin-top: 0.3rem;
        padding-top: 0.7rem;
        border-top: 1px solid var(--border);
      }
      .success-note {
        margin: 0.8rem 0 0;
        color: var(--success);
        font-weight: 700;
      }
      .not-found {
        max-width: 780px;
        margin: 2rem auto;
        padding: 1.5rem;
        text-align: center;
      }
      @media (max-width: 940px) {
        .plan-layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 760px) {
        .plan-hero {
          flex-direction: column;
        }
        .extra-card {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PlanConfigComponent implements OnInit {
  plan = signal<PlanCard | null>(null);
  extras: PlanExtra[] = PLAN_EXTRAS;
  selectedExtraIds = signal<string[]>([]);
  saving = signal(false);
  feedback = signal('');
  eventTitle = '';
  customExtraNote = '';

  constructor(
    public authService: AuthService,
    private eventsService: EventoService,
    private planDraftService: PlanDraftService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const selected = PLANS.find((plan) => plan.id === id) ?? null;
    this.plan.set(selected);

    const draft = this.planDraftService.get();
    if (draft && draft.planId === id) {
      this.eventTitle = draft.eventTitle;
      this.selectedExtraIds.set(draft.selectedExtras.map((extra) => extra.id));
      this.customExtraNote = draft.customExtraNote;
    } else if (selected) {
      this.eventTitle = selected.name;
    }
  }

  isSelected(extraId: string): boolean {
    return this.selectedExtraIds().includes(extraId);
  }

  toggleExtra(extraId: string, checked: boolean): void {
    const current = this.selectedExtraIds();
    if (checked) {
      this.selectedExtraIds.set([...current, extraId]);
    } else {
      this.selectedExtraIds.set(current.filter((id) => id !== extraId));
    }
    this.feedback.set('');
  }

  extrasTotal(): number {
    const selected = new Set(this.selectedExtraIds());
    return this.extras
      .filter((extra) => selected.has(extra.id))
      .reduce((sum, extra) => sum + extra.price, 0);
  }

  totalPrice(): number {
    return (this.plan()?.basePrice ?? 0) + this.extrasTotal();
  }

  selectedExtras(): PlanExtra[] {
    const selected = new Set(this.selectedExtraIds());
    return this.extras.filter((extra) => selected.has(extra.id));
  }

  confirmPlan(): void {
    const selectedPlan = this.plan();
    if (!selectedPlan) {
      return;
    }

    const draft = {
      eventTitle: this.eventTitle.trim() || selectedPlan.name,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      planSummary: selectedPlan.summary,
      basePrice: selectedPlan.basePrice,
      extrasTotal: this.extrasTotal(),
      totalPrice: this.totalPrice(),
      customExtraNote: this.customExtraNote.trim(),
      selectedExtras: this.selectedExtras(),
    };

    if (!this.authService.isAuthenticated()) {
      this.planDraftService.save(draft);
      this.router.navigate(['/auth/register']);
      return;
    }

    this.saving.set(true);
    this.feedback.set('');

    this.eventsService.create(this.planDraftService.toCreateEventoDto(draft)).subscribe({
      next: (event) => {
        this.planDraftService.clear();
        this.feedback.set('Plan confirmado y guardado en tu panel.');
        this.router.navigate(this.authService.isAdmin() ? ['/admin/events', event.id, 'edit'] : ['/dashboard']);
      },
      error: () => {
        this.saving.set(false);
        this.feedback.set('No se pudo guardar el plan. Intentalo de nuevo.');
      },
      complete: () => this.saving.set(false),
    });
  }
}
