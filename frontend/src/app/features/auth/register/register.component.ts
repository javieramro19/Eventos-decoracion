import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/services/auth.service';
import { EventoService } from '../../../core/services/events.service';
import { PlanDraftService } from '../../../core/services/plan-draft.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatButtonModule],
  template: `
    <div class="auth-page">
      <section class="auth-panel auth-form">
        <span class="eyebrow">Registro</span>
        <h1>Crea tu cuenta y empieza a disenar tu propuesta.</h1>
        <p class="helper">Completa tus datos para acceder a planes, extras y seguimiento personalizado del evento.</p>
        <p *ngIf="planDraftService.hasDraft()" class="helper helper-accent">Tu plan pendiente se confirmara automaticamente al crear la cuenta.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="sonic-field sonic-field--glass">
            <label for="register-name">Nombre</label>
            <input id="register-name" formControlName="name" placeholder="Tu nombre o empresa">
            <span class="field-error" *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')">El nombre es obligatorio</span>
          </div>

          <div class="sonic-field sonic-field--glass">
            <label for="register-email">Email</label>
            <input id="register-email" formControlName="email" type="email" autocomplete="username" placeholder="cliente@evento.com">
            <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('required')">El email es obligatorio</span>
            <span class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">Introduce un email valido</span>
          </div>

          <div class="sonic-field sonic-field--glass">
            <label for="register-password">Contrasena</label>
            <input id="register-password" formControlName="password" type="password" autocomplete="new-password" placeholder="Minimo 8 caracteres">
            <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.hasError('required')">La contrasena es obligatoria</span>
            <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.hasError('minlength')">La contrasena debe tener al menos 8 caracteres</span>
            <span class="field-error" *ngIf="form.get('password')?.touched && form.get('password')?.hasError('pattern')">Debe incluir mayuscula, minuscula y numero</span>
          </div>

          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>

          <button mat-raised-button color="primary" class="submit-button" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Creando cuenta...' : 'Registrarme' }}
          </button>
        </form>

        <p class="switch-link">Ya tienes cuenta? <a routerLink="/auth/login">Iniciar sesion</a></p>
      </section>

      <section class="auth-panel auth-copy">
        <span class="eyebrow">Que obtienes</span>
        <h2>Una experiencia mas clara para vender y personalizar eventos decorativos.</h2>

        <div class="feature-stack">
          <article>
            <div class="ui-mark">PL</div>
            <div>
              <h3>Planes con estructura</h3>
              <p>Tarjetas listas para presentar opciones con metricas y alcance visual.</p>
            </div>
          </article>
          <article>
            <div class="ui-mark">EX</div>
            <div>
              <h3>Extras configurables</h3>
              <p>El cliente puede pedir anadidos concretos y dejar comentarios detallados.</p>
            </div>
          </article>
          <article>
            <div class="ui-mark">VP</div>
            <div>
              <h3>Imagen mas premium</h3>
              <p>Una interfaz mas limpia mejora la percepcion del servicio desde el primer vistazo.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .auth-page {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 0.92fr 1.08fr;
        gap: 1.25rem;
      }
      .auth-panel {
        border-radius: 36px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
      }
      .auth-form {
        padding: 2rem;
        background: linear-gradient(180deg, #fffdf9 0%, #f7f1ea 100%);
      }
      .auth-copy {
        padding: 2.2rem;
        background:
          radial-gradient(circle at bottom right, rgba(190, 204, 184, 0.24), transparent 30%),
          linear-gradient(135deg, #f5f4ee 0%, #ece6dc 100%);
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
        margin: 0.8rem 0 0.6rem;
        font-size: clamp(2.2rem, 4vw, 3.9rem);
        line-height: 1.08;
        max-width: 11ch;
      }
      h2 {
        margin: 0.8rem 0 1.5rem;
        font-size: clamp(2rem, 3vw, 3.2rem);
        max-width: 13ch;
        line-height: 1.08;
      }
      .helper, .feature-stack p, .switch-link { color: var(--text-soft); }
      .helper-accent {
        color: var(--accent-strong);
        font-weight: 700;
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
      .switch-link { margin-top: 1.25rem; }
      .switch-link a {
        color: var(--accent-strong);
        font-weight: 800;
      }
      .feature-stack {
        display: grid;
        gap: 1rem;
      }
      .feature-stack article {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.74);
      }
      .feature-stack h3 {
        margin: 0 0 0.2rem;
        font-size: 1.35rem;
      }
      .feature-stack p { margin: 0; }
      @media (max-width: 900px) {
        .auth-page {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RegisterComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)]],
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

    this.authService.register(this.form.getRawValue() as { name: string; email: string; password: string }).subscribe({
      next: () => this.handlePostAuth(),
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo completar el registro. Intentalo de nuevo en unos instantes.';
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
        this.errorMessage = 'La cuenta se creo, pero no pudimos guardar el plan pendiente.';
        this.router.navigate(['/dashboard']);
      },
    });
  }
}
