import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PLANS } from '../plans/plans.data';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div class="landing-shell">
      <section class="hero-section">
        <div class="hero-copy">
          <span class="eyebrow">Decoracion para eventos memorables</span>
          <h1>EventoSonic transforma cada celebracion en una escena inolvidable.</h1>
          <p class="hero-text">
            Disenamos decoraciones para bodas, cumpleanos, eventos corporativos y celebraciones privadas con una propuesta visual clara, elegante y adaptable a cada cliente.
          </p>
          <div class="hero-actions">
            <a mat-raised-button color="primary" routerLink="/auth/register">Quiero mi propuesta</a>
            <a mat-stroked-button [routerLink]="['/']" fragment="planes">Ver planes</a>
          </div>
          <div class="hero-highlights">
            <div>
              <strong>+120</strong>
              <span>montajes realizados</span>
            </div>
            <div>
              <strong>48 h</strong>
              <span>para recibir propuesta base</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>personalizable por evento</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="visual-card tall">
            <span class="card-label">Ambientacion</span>
            <h3>Bodas con identidad propia</h3>
            <p>Paletas, flores, iluminacion y rincones fotograficos coordinados.</p>
          </div>
          <div class="visual-stack">
            <div class="visual-card">
              <span class="card-label">Produccion</span>
              <h3>Montaje por fases</h3>
              <p>Planificamos tiempos, materiales y acabados con antelacion.</p>
            </div>
            <div class="visual-card accent">
              <span class="card-label">Experiencia</span>
              <h3>Configura extras al elegir plan</h3>
              <p>Cada plan lleva a su configurador propio con extras y precio final dinamico.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="story-section">
        <div class="section-heading">
          <span class="eyebrow">Inicio</span>
          <h2>Una empresa pensada para decorar eventos con estilo, orden y flexibilidad.</h2>
        </div>
        <div class="story-grid">
          <article>
            <div class="ui-mark">CV</div>
            <h3>Concepto visual completo</h3>
            <p>Definimos una linea estetica coherente para que cada rincon sume a la experiencia.</p>
          </article>
          <article>
            <div class="ui-mark">AC</div>
            <h3>Acompanamiento cercano</h3>
            <p>Guiamos al cliente desde la idea inicial hasta los extras finales del montaje.</p>
          </article>
          <article>
            <div class="ui-mark">PE</div>
            <h3>Planes escalables</h3>
            <p>Partimos de paquetes claros y luego personalizamos segun invitados, espacio y objetivos.</p>
          </article>
        </div>
      </section>

      <section id="planes" class="plans-section">
        <div class="section-heading">
          <span class="eyebrow">Planes</span>
          <h2>Propuestas claras para presentar y vender mejor cada tipo de evento.</h2>
          <p>Elige primero el plan que mejor encaja con tu celebracion. En el siguiente paso podras marcar extras, ver precio final y confirmar.</p>
        </div>

        <div class="plans-grid">
          <article *ngFor="let plan of plans" class="plan-card">
            <div class="plan-top">
              <div>
                <span class="plan-tag">{{ plan.name }}</span>
                <h3>{{ plan.priceLabel }}</h3>
              </div>
              <p>{{ plan.description }}</p>
            </div>

            <p class="plan-summary">{{ plan.summary }}</p>

            <div class="metrics-row">
              <div *ngFor="let metric of plan.metrics" class="metric-pill">
                <strong>{{ metric.value }}</strong>
                <span>{{ metric.label }}</span>
              </div>
            </div>

            <ul>
              <li *ngFor="let feature of plan.features">{{ feature }}</li>
            </ul>

            <div class="plan-actions">
              <a mat-raised-button color="primary" [routerLink]="['/plans', plan.id]">Elegir este plan</a>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .landing-shell { display: grid; gap: 2rem; }
      .hero-section, .story-section, .plans-section {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 36px;
        box-shadow: var(--shadow-sm);
      }
      .hero-section {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 2rem;
        padding: 2.4rem;
        background:
          radial-gradient(circle at top left, rgba(212, 175, 122, 0.16), transparent 28%),
          radial-gradient(circle at bottom right, rgba(245, 230, 218, 0.5), transparent 24%),
          var(--surface);
      }
      .eyebrow {
        display: inline-block;
        margin-bottom: 0.8rem;
        color: var(--accent-strong);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.75rem;
        font-weight: 800;
      }
      h1, h2, h3 { font-family: var(--font-display); }
      h1 {
        margin: 0;
        font-size: clamp(2.5rem, 5vw, 4.8rem);
        line-height: 1.08;
        max-width: 12ch;
      }
      .hero-text, .section-heading p, .story-grid p, .plan-top p, .plan-summary {
        color: var(--text-soft);
      }
      .hero-text { max-width: 62ch; margin: 1.1rem 0 0; font-size: 1.05rem; }
      .hero-actions { display: flex; flex-wrap: wrap; gap: 0.9rem; margin: 1.6rem 0; }
      .hero-highlights {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .hero-highlights div, .metric-pill {
        padding: 1rem;
        border-radius: 22px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.76);
      }
      .hero-highlights strong, .metric-pill strong {
        display: block;
        font-size: 1.35rem;
      }
      .hero-highlights span, .metric-pill span {
        color: var(--muted);
        font-size: 0.92rem;
      }
      .hero-visual { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; min-height: 100%; }
      .visual-stack { display: grid; gap: 1rem; }
      .visual-card {
        padding: 1.4rem;
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.84);
        border: 1px solid var(--border);
        min-height: 170px;
      }
      .visual-card.tall { min-height: 100%; background: linear-gradient(180deg, var(--surface) 0%, var(--surface-alt) 100%); }
      .visual-card.accent { background: linear-gradient(180deg, #faf6f1 0%, #f5e6da 100%); }
      .card-label, .plan-tag {
        display: inline-flex;
        align-items: center;
        padding: 0.4rem 0.7rem;
        border-radius: 999px;
        background: rgba(212, 175, 122, 0.15);
        color: var(--accent-strong);
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .section-heading { padding: 2rem 2rem 0; }
      .section-heading h2 { margin: 0; font-size: clamp(1.9rem, 3vw, 3rem); max-width: 18ch; line-height: 1.08; }
      .section-heading p { margin: 0.8rem 0 0; max-width: 62ch; }
      .story-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        padding: 2rem;
      }
      .story-section, .plans-section {
        background: linear-gradient(180deg, #fffdfb 0%, #fff8f3 100%);
      }
      .story-grid article, .plan-card {
        border-radius: 28px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.9);
      }
      .story-grid article { padding: 1.5rem; display: grid; gap: 1rem; }
      .plans-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
        padding: 2rem;
      }
      .plan-card {
        padding: 1.5rem;
        background: linear-gradient(180deg, #ffffff 0%, #fcf7f1 100%);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .plan-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      .plan-top h3 { margin: 0.8rem 0 0.4rem; font-size: 2rem; line-height: 1.08; }
      .plan-summary {
        margin: 1rem 0 0;
        padding: 1rem;
        border-radius: 18px;
        background: rgba(245, 230, 218, 0.35);
        line-height: 1.65;
      }
      .metrics-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1.4rem 0;
      }
      ul {
        margin: 0;
        padding-left: 1.15rem;
        display: grid;
        gap: 0.55rem;
      }
      .plan-actions {
        margin-top: 1.25rem;
        display: flex;
      }
      @media (max-width: 1080px) {
        .hero-section, .plans-grid, .story-grid {
          grid-template-columns: 1fr;
        }
        .hero-visual { min-height: auto; }
      }
      @media (max-width: 720px) {
        .hero-section, .section-heading, .story-grid, .plans-grid { padding: 1.2rem; }
        .hero-highlights, .metrics-row { grid-template-columns: 1fr; }
        .hero-visual { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class LandingComponent {
  plans = PLANS;
}
