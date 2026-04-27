import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/events.service';
import { PlanDraftService } from '../../../core/services/plan-draft.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule],
  template: `
    <div class="auth-page">
      <section class="auth-panel auth-copy">
        <span class="eyebrow">Acceso EventoSonic</span>
        <h1>Entra para gestionar planes, extras y eventos decorativos.</h1>
        <p>Revisa tus solicitudes, personaliza montajes y manten toda la informacion del evento en un solo espacio.</p>

        <div class="benefits">
          <article>
            <div class="ui-mark">SE</div>
            <div>
              <h3>Seguimiento centralizado</h3>
              <span>Consulta tus eventos y cambios desde el panel.</span>
            </div>
          </article>
          <article>
            <div class="ui-mark">EX</div>
            <div>
              <h3>Extras bien definidos</h3>
              <span>Anade mejoras visuales sin perder orden en la propuesta.</span>
            </div>
          </article>
        </div>
      </section>

      <section class="auth-panel auth-form">
        <span class="eyebrow">Iniciar sesion</span>
        <h2>Bienvenido de nuevo</h2>
        <p class="helper">Accede con tu email y contrasena para continuar.</p>
        <p *ngIf="planDraftService.hasDraft()" class="helper helper-accent">Tu configuracion del plan se guardara en cuanto entres.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="sonic-field sonic-field--glass">
            <label for="login-email">Email</label>
            <input id="login-email" formControlName="email" type="email" autocomplete="username" placeholder="cliente@evento.com">
            <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('required')">El email es obligatorio</span>
            <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">Introduce un email valido</span>
          </div>

          <div class="sonic-field sonic-field--glass">
            <label for="login-password">Contrasena</label>
            <input id="login-password" formControlName="password" type="password" autocomplete="current-password" placeholder="Tu contrasena">
            <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.hasError('required')">La contrasena es obligatoria</span>
          </div>

          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>

          <button mat-raised-button color="primary" class="submit-button" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Entrando...' : 'Entrar al panel' }}
          </button>
        </form>

        <p class="switch-link">No tienes cuenta? <a routerLink="/auth/register">Crear cuenta</a></p>
      </section>
    </div>
  `,
  styles: [
    `
      .auth-page {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 1.25rem;
      }
      .auth-panel {
        border-radius: 36px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .auth-copy {
        padding: 2.2rem;
        background:
          radial-gradient(circle at top left, rgba(202, 170, 145, 0.18), transparent 28%),
          linear-gradient(135deg, #f9f2ea 0%, #efe6dc 100%);
      }
      .auth-form {
        padding: 2rem;
        background: linear-gradient(180deg, #fffdf9 0%, #f9f2ea 100%);
      }
      .eyebrow {
        color: var(--accent-strong);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.74rem;
        font-weight: 800;
      }
      h1, h2, h3 { font-family: var(--font-display); }
      h1 {
        margin: 0.8rem 0 1rem;
        font-size: clamp(2.2rem, 4vw, 4.2rem);
        line-height: 1.08;
        max-width: 10ch;
      }
      h2 {
        margin: 0.6rem 0 0;
        font-size: 2.1rem;
        line-height: 1.08;
      }
      p, .helper, .switch-link { color: var(--text-soft); }
      .helper-accent {
        color: var(--accent-strong);
        font-weight: 700;
      }
      .benefits {
        display: grid;
        gap: 1rem;
        margin-top: 2rem;
      }
      .benefits article {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        padding: 1rem;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.68);
      }
      .benefits h3 {
        margin: 0;
        font-size: 1.35rem;
      }
      .benefits span {
        color: var(--muted);
      }
      form {
        display: grid;
        gap: 0.9rem;
        margin-top: 1.2rem;
      }
      .submit-button { margin-top: 0.4rem; min-height: 3rem; }
      .error-message {
        margin: 0.1rem 0;
        color: #a03a2c;
        font-weight: 700;
      }
      .switch-link {
        margin-top: 1.25rem;
      }
      .switch-link a {
        color: var(--accent-strong);
        font-weight: 800;
      }
      @media (max-width: 900px) {
        .auth-page {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private eventsService: EventoService,
    public planDraftService: PlanDraftService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => this.handlePostAuth(),
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo iniciar sesion. Revisa tus credenciales e intentalo otra vez.';
      },
    });
  }

  private handlePostAuth(): void {
    const draft = this.planDraftService.get();
    if (!draft) {
      this.loading = false;
      this.router.navigate(['/dashboard']);
      return;
    }

    this.eventsService.create(this.planDraftService.toCreateEventoDto(draft)).subscribe({
      next: (event) => {
        this.planDraftService.clear();
        this.router.navigate(['/events', event.id]);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'La sesion se inicio, pero no pudimos guardar el plan pendiente.';
        this.router.navigate(['/dashboard']);
      },
    });
  }
}
