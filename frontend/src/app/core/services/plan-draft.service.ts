import { Injectable } from '@angular/core';
import { CreateEventoDto, PlanSelectionExtra } from '../models/event.model';

export interface PendingPlanDraft {
  planId: string;
  planName: string;
  planSummary: string;
  basePrice: number;
  extrasTotal: number;
  totalPrice: number;
  customExtraNote: string;
  selectedExtras: PlanSelectionExtra[];
}

@Injectable({ providedIn: 'root' })
export class PlanDraftService {
  private readonly storageKey = 'eventosonic.pending-plan';

  save(draft: PendingPlanDraft): void {
    localStorage.setItem(this.storageKey, JSON.stringify(draft));
  }

  get(): PendingPlanDraft | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as PendingPlanDraft;
    } catch {
      this.clear();
      return null;
    }
  }

  hasDraft(): boolean {
    return !!this.get();
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  toCreateEventoDto(draft: PendingPlanDraft): CreateEventoDto {
    const extrasSummary = draft.selectedExtras.length > 0
      ? draft.selectedExtras.map((extra) => extra.name).join(', ')
      : 'Sin extras seleccionados';
    const customNote = draft.customExtraNote.trim();
    const descriptionParts = [
      draft.planSummary,
      `Extras elegidos: ${extrasSummary}.`,
      customNote ? `Peticion personalizada: ${customNote}.` : '',
    ].filter(Boolean);

    return {
      title: `Solicitud ${draft.planName}`,
      description: descriptionParts.join(' '),
      category: 'other',
      planId: draft.planId,
      planName: draft.planName,
      planSummary: draft.planSummary,
      basePrice: draft.basePrice,
      extrasTotal: draft.extrasTotal,
      totalPrice: draft.totalPrice,
      customExtraNote: customNote || undefined,
      selectedExtras: draft.selectedExtras,
      source: 'plan-config',
    };
  }
}
