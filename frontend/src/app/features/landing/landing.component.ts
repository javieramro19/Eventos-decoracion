import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { PLANS } from '../plans/plans.data';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent {
  constructor(public authService: AuthService) {}

  plans = PLANS;
  gallery = [
    {
      image: 'assets/imagen1.jpg',
      title: 'Mesa dulce para boda',
      description: 'Montaje en tonos neutros y dorados para banquetes, bienvenida o recena.',
    },
    {
      image: 'assets/imagen2.jpg',
      title: 'Cumpleanos tematico',
      description: 'Decoracion pensada para fiestas infantiles o familiares con colores personalizados.',
    },
    {
      image: 'assets/imagen3.jpg',
      title: 'Corner para empresa',
      description: 'Espacios de apoyo visual para presentaciones, inauguraciones o eventos de marca.',
    },
    {
      image: 'assets/imagen4.jpg',
      title: 'Comunion o bautizo',
      description: 'Mesas y rincones decorativos para celebraciones de dia con estilo delicado y ordenado.',
    },
  ];
  process = [
    {
      title: 'Cuentanos tu idea',
      description: 'Recogemos fecha, tipo de evento, numero de invitados y estilo aproximado.',
    },
    {
      title: 'Preparamos una propuesta',
      description: 'Te mostramos un plan base con extras opcionales y una estimacion realista.',
    },
    {
      title: 'Ajustamos los detalles',
      description: 'Adaptamos colores, materiales y zonas decorativas antes de confirmar.',
    },
    {
      title: 'Guardas y gestionas',
      description: 'El plan confirmado queda registrado para seguirlo desde tu panel.',
    },
  ];
  contact = [
    { title: 'Zona de trabajo', value: 'Almeria y alrededores, con servicio segun disponibilidad.' },
    { title: 'Tipo de eventos', value: 'Bodas, comuniones, cumpleanos, bautizos y eventos corporativos.' },
    { title: 'Primer paso', value: 'Elegir un plan y personalizarlo con los extras que necesites.' },
  ];

  get authRoute(): string {
    return this.authService.isAuthenticated() ? '/dashboard' : '/auth/login';
  }

  get authLabel(): string {
    return this.authService.isAuthenticated() ? 'Ir a mi panel' : 'Iniciar sesion / Crear cuenta';
  }
}
