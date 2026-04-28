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
    description: 'Pensado para celebraciones pequenas que necesitan una decoracion bonita, clara y facil de montar.',
    summary: 'Una opcion base para quienes quieren vestir una zona principal sin entrar todavia en un montaje complejo.',
    metrics: [
      { value: '40', label: 'invitados' },
      { value: '1 zona', label: 'decorada' },
      { value: '48 h', label: 'respuesta' },
    ],
    features: [
      'Mesa principal o rincon decorativo',
      'Paleta de color adaptada al evento',
      'Carteleria basica y montaje sencillo',
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
    description: 'La opcion mas equilibrada para bodas pequenas, comuniones y celebraciones con varias zonas visibles.',
    summary: 'Permite trabajar mas de un punto del evento para que entrada, mesa principal y photocall mantengan una misma linea visual.',
    metrics: [
      { value: '70', label: 'invitados' },
      { value: '3 zonas', label: 'destacadas' },
      { value: '1 extra', label: 'revision' },
    ],
    features: [
      'Entrada, mesa principal y photocall',
      'Iluminacion decorativa y apoyo floral',
      'Revision de extras y orden de montaje',
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
    description: 'Pensado para eventos grandes o montajes donde toda la decoracion necesita una direccion visual mas completa.',
    summary: 'Es la propuesta mas amplia para celebraciones con varias zonas, mayor numero de invitados y mas necesidad de coordinacion.',
    metrics: [
      { value: '90+', label: 'invitados' },
      { value: '5 zonas', label: 'decoradas' },
      { value: 'Total', label: 'soporte' },
    ],
    features: [
      'Concepto integral del evento',
      'Coordinacion visual de varios espacios',
      'Montaje extendido con extras premium',
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
