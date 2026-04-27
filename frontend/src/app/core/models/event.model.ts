export interface Evento {
  id: number;
  userId: number;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  eventDate?: string;
  location?: string;
  isPublished?: boolean;
  coverImage?: string;
  planId?: string;
  planName?: string;
  planSummary?: string;
  basePrice?: number;
  extrasTotal?: number;
  totalPrice?: number;
  customExtraNote?: string;
  selectedExtras?: PlanSelectionExtra[];
  source?: string;
  createdAt: string;
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
  description?: string;
  status?: string;
  category?: string;
  eventDate?: string;
  location?: string;
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

export interface DashboardStatItem {
  status: string;
  count: number;
}

export interface DashboardStats {
  total: number;
  byStatus: DashboardStatItem[];
  recent: Evento[];
  thisWeek: number;
}
