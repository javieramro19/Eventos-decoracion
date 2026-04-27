export interface PlanMetric {
  value: string;
  label: string;
}

export interface PlanCard {
  id: string;
  name: string;
  priceLabel: string;
  basePrice: number;
  description: string;
  summary: string;
  metrics: PlanMetric[];
  features: string[];
  includes: string[];
}

export interface PlanExtra {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export const PLANS: PlanCard[] = [
  {
    id: 'esencial',
    name: 'Plan Esencial',
    priceLabel: 'Desde 390 EUR',
    basePrice: 390,
    description: 'Perfecto para celebraciones intimas que necesitan una presencia visual cuidada y practica.',
    summary: 'Incluye una propuesta decorativa base para espacios pequenos o celebraciones sencillas, con una estetica definida y rapida de ejecutar.',
    metrics: [
      { value: '20-40', label: 'invitados' },
      { value: '1', label: 'zona decorada' },
      { value: '48 h', label: 'propuesta inicial' },
    ],
    features: [
      'Mesa principal o rincon decorativo',
      'Paleta cromatica personalizada',
      'Carteleria basica y montaje express',
    ],
    includes: [
      'Asesoria inicial de estilo',
      'Diseno de una zona principal',
      'Montaje y retirada basica',
    ],
  },
  {
    id: 'elegante',
    name: 'Plan Elegante',
    priceLabel: 'Desde 790 EUR',
    basePrice: 790,
    description: 'La opcion mas equilibrada para bodas civiles, cumpleanos premium y eventos de marca.',
    summary: 'Pensado para quienes quieren una ambientacion mas completa, con varias zonas trabajadas y una imagen mas cuidada en conjunto.',
    metrics: [
      { value: '40-90', label: 'invitados' },
      { value: '3', label: 'ambientes clave' },
      { value: '1', label: 'revision extra' },
    ],
    features: [
      'Entrada, mesa principal y photocall',
      'Iluminacion decorativa y elementos florales',
      'Asesoria de extras y cronograma de montaje',
    ],
    includes: [
      'Diseno de hasta 3 zonas',
      'Coordinacion de color y materiales',
      'Seguimiento de montaje ampliado',
    ],
  },
  {
    id: 'exclusivo',
    name: 'Plan Exclusivo',
    priceLabel: 'Desde 1.290 EUR',
    basePrice: 1290,
    description: 'Disenado para celebraciones que buscan una experiencia inmersiva y altamente personalizada.',
    summary: 'Es la opcion mas completa, ideal para eventos con mas invitados, varios espacios y un nivel alto de personalizacion visual.',
    metrics: [
      { value: '90+', label: 'invitados' },
      { value: '5', label: 'zonas decoradas' },
      { value: 'Full', label: 'acompanamiento' },
    ],
    features: [
      'Concepto integral del evento',
      'Coordinacion visual de varios espacios',
      'Seleccion premium de extras y montaje extendido',
    ],
    includes: [
      'Direccion creativa completa',
      'Montaje en multiples zonas',
      'Acompanamiento personalizado',
    ],
  },
];

export const PLAN_EXTRAS: PlanExtra[] = [
  {
    id: 'photocall',
    name: 'Photocall tematico',
    detail: 'Estructura con fondos, flores, neon o elementos de marca para fotos memorables.',
    price: 140,
  },
  {
    id: 'mesa-dulce',
    name: 'Mesa dulce decorada',
    detail: 'Composicion visual completa con soportes, carteleria y detalles de color.',
    price: 190,
  },
  {
    id: 'iluminacion',
    name: 'Iluminacion ambiental',
    detail: 'Guirnaldas, puntos calidos o acentos LED para dar mas atmosfera al evento.',
    price: 120,
  },
  {
    id: 'papeleria',
    name: 'Papeleria personalizada',
    detail: 'Nombres de mesa, seating plan, carteles o etiquetas con estilo coherente.',
    price: 95,
  },
];
