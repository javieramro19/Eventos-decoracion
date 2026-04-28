export interface Evento {
  id: number;
  userId: number;
  title: string;
  slug: string;
  description?: string;
  status?: string;
  category?: string;
  eventDate?: string;
  location?: string;
  isPublished: boolean;
  coverImage?: string;
  images?: string[];
  planId?: string;
  planName?: string;
  planSummary?: string;
  basePrice?: number;
  extrasTotal?: number;
  totalPrice?: number;
  customExtraNote?: string;
  selectedExtras?: PlanSelectionExtra[];
  gallery?: GalleryImage[];
  sections?: EventSection[];
  source?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GalleryImage {
  id: number;
  eventId: number;
  imageUrl: string;
  caption?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type EventSectionType = 'hero' | 'gallery' | 'about' | 'contact';

export interface EventSectionContent {
  eyebrow?: string;
  title?: string;
  summary?: string;
  heading?: string;
  description?: string;
  body?: string;
  planHeading?: string;
  planSummary?: string;
  ctaLabel?: string;
}

export interface EventSection {
  id: number;
  eventId: number;
  type: EventSectionType;
  content: EventSectionContent;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanSelectionExtra {
  id: string;
  name: string;
  detail: string;
  price: number;
}

export interface CreateEventoDto {
  title: string;
  slug?: string;
  description?: string;
  status?: string;
  category?: string;
  eventDate?: string;
  location?: string;
  isPublished?: boolean;
  coverImage?: string;
  images?: string[];
  planId?: string;
  planName?: string;
  planSummary?: string;
  basePrice?: number;
  extrasTotal?: number;
  totalPrice?: number;
  customExtraNote?: string;
  selectedExtras?: PlanSelectionExtra[];
  source?: string;
}

export interface UpdateEventoDto extends Partial<CreateEventoDto> {}

export interface GalleryMutationResponse {
  event: Evento;
  gallery: GalleryImage[];
}

export interface SectionReorderItem {
  id: number;
  order: number;
}

export type ContactStatus = 'pending' | 'contacted' | 'converted' | 'rejected';

export interface EventContact {
  id: number;
  eventId: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt?: string;
  eventTitle?: string;
  eventSlug?: string;
}

export interface CreateEventContactDto {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface DashboardStatItem {
  type: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
  message: string;
}

export interface DashboardStats {
  totalEvents: number;
  publishedEvents: number;
  pendingContacts: number;
  stalePendingContacts: number;
  recentEvents: Evento[];
  recentContacts: EventContact[];
  alerts: DashboardStatItem[];
}
