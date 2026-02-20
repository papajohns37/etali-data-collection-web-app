import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

import { MulliganService } from '../../services/mulligan.service';
import { DecklistService } from '../../services/decklist.service';
import {
  MulliganEvaluationResponse,
  MulliganSessionSummary,
  MulliganStartResponse,
} from '../../models/mulligan.model';
import { Hand } from '../../models/hand.model';
import { Card } from '../../models/card.model';
import {
  SharedHandEvaluationComponent,
  HandEvaluationData,
  HandMetadata,
} from '../shared-hand-evaluation/shared-hand-evaluation.component';

/** Card name used to detect Serum Powder in the decklist. */
const SERUM_POWDER_NAME = 'Serum Powder';

/**
 * Phases of the mulligan flow:
 *  start       – before the first API call
 *  evaluating  – hand is displayed; user arranges battlefield and marks canCastEtali
 *  deciding    – user cannot cast Etali; overlay shows Mulligan / Serum Powder options
 *  serum-powder – user is selecting cards to bottom before Serum Powder activation
 *  loading     – waiting for API response
 *  complete    – session finished, summary shown
 */
type MulliganPhase = 'start' | 'evaluating' | 'deciding' | 'serum-powder' | 'loading' | 'complete';

@Component({
  selector: 'app-mulligan-session',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    DividerModule,
    SharedHandEvaluationComponent,
  ],
  templateUrl: './mulligan-session.component.html',
  styleUrl: './mulligan-session.component.css',
})
export class MulliganSessionComponent {
  // ── Injected dependencies ──────────────────────────────────────────────────
  private mulliganService = inject(MulliganService);
  private decklistService = inject(DecklistService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  // ── URL-derived decklist ID ────────────────────────────────────────────────
  readonly decklistId = signal<number>(0);

  // ── Session state ──────────────────────────────────────────────────────────
  sessionId = signal<number | null>(null);
  currentHand = signal<Hand | null>(null);
  handNumber = signal<number>(1);
  targetHandSize = signal<number>(7);
  canMulligan = signal<boolean>(true);

  // ── Phase ──────────────────────────────────────────────────────────────────
  phase = signal<MulliganPhase>('start');

  /**
   * Monotonically increasing counter incremented for every new hand (including
   * Serum Powder re-deals). Passed as [handId] to SharedHandEvaluationComponent
   * so the battlefield is reliably cleared independent of backend-returned IDs.
   */
  handKey = signal<number>(0);

  // ── Stored evaluation while user decides next action ──────────────────────
  /** Captured when canCastEtali = false and we need to wait for keep/mulligan/SP */
  pendingEvaluation = signal<HandEvaluationData | null>(null);

  // ── Serum Powder card selection ────────────────────────────────────────────
  /** Zero-based indices into currentHand.cards for the bottom of the library */
  selectedCardsToBottom = signal<number[]>([]);

  // ── Completion state ───────────────────────────────────────────────────────
  summary = signal<MulliganSessionSummary | null>(null);

  // ── Computed helpers ───────────────────────────────────────────────────────

  /** Cards to display in SharedHandEvaluationComponent */
  handCards = computed<Card[]>(() => this.currentHand()?.cards ?? []);

  /** Metadata forwarded to SharedHandEvaluationComponent */
  handMetadata = computed<HandMetadata>(() => {
    const h = this.currentHand();
    return {
      seatOrder: h?.seatOrder ?? 0,
      stickers: h?.stickers ?? [],
      lowestGambleOdds: h?.lowestGambleOdds ?? 0,
      decklistName: h?.decklistName ?? this.decklistName(),
      handNumber: this.handNumber(),
      targetHandSize: this.targetHandSize(),
    };
  });

  /** All cards in the selected decklist, for the library search. */
  deckAllCards = computed<Card[]>(() => {
    const id = this.decklistId();
    return this.decklistService.decklists().find(d => d.id === id)?.cards ?? [];
  });

  /** True when the decklist contains at least one Serum Powder. */
  deckHasSerumPowder = computed(() => {
    return this.deckAllCards().some(
      (c) => c.name.toLowerCase() === SERUM_POWDER_NAME.toLowerCase()
    );
  });

  /** True when the current hand contains at least one Serum Powder. */
  handHasSerumPowder = computed(() => {
    return this.handCards().some(
      (c) => c.name.toLowerCase() === SERUM_POWDER_NAME.toLowerCase()
    );
  });

  /** Display name of the selected decklist. */
  decklistName = computed(() => {
    const id = this.decklistId();
    return this.decklistService.decklists().find(d => d.id === id)?.name ?? `Decklist #${id}`;
  });

  /** Pass `true` to SharedHandEvaluationComponent while waiting for API or deciding. */
  sharedIsLoading = computed(
    () => this.phase() === 'loading' || this.phase() === 'deciding' || this.phase() === 'serum-powder'
  );

  /**
   * Label for the Submit button inside SharedHandEvaluationComponent.
   * When the player is forced to keep (3-card hand), we make the intent clear.
   */
  submitBtnLabel = computed(() =>
    !this.canMulligan() || this.targetHandSize() <= 3
      ? 'Keep Hand (Forced)'
      : 'Submit Evaluation'
  );

  /** Number of cards that must go to the bottom before Serum Powder activates. */
  requiredBottomCount = computed(() => 7 - this.targetHandSize());

  /** True when the user has selected the correct number of cards to bottom. */
  serumPowderConfirmEnabled = computed(
    () => this.selectedCardsToBottom().length === this.requiredBottomCount()
  );

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.decklistId.set(isNaN(id) ? 0 : id);
    // Ensure decklists are loaded for Serum Powder detection and library search.
    if (this.decklistService.decklists().length === 0) {
      this.decklistService.loadDecklists().subscribe();
    }
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  startSession(): void {
    if (!this.decklistId()) return;
    this.phase.set('loading');
    this.mulliganService.startSession(this.decklistId()).subscribe({
      next: (r: MulliganStartResponse) => this.applyStartResponse(r),
      error: (err) => this.handleError(err, 'Failed to start mulligan session'),
    });
  }

  // ── Evaluation submitted from SharedHandEvaluationComponent ───────────────

  onEvaluationSubmitted(data: HandEvaluationData): void {
    // Auto-keep when hand succeeds
    if (data.canCastEtali) {
      this.callEvaluateHand(data, { keepHand: true });
      return;
    }

    // Forced keep when no further mulligans are possible
    if (!this.canMulligan() || this.targetHandSize() <= 3) {
      this.callEvaluateHand(data, { keepHand: true });
      return;
    }

    // No Serum Powder in deck — auto-mulligan without showing the decision overlay
    if (!this.deckHasSerumPowder()) {
      this.callEvaluateHand(data, { keepHand: false });
      return;
    }

    // Cannot cast Etali, can mulligan, AND deck has Serum Powder — show decision overlay
    this.pendingEvaluation.set(data);
    this.phase.set('deciding');
  }

  // ── Decision actions (shown after evaluation when canCastEtali = false) ────

  mulligan(): void {
    const pending = this.pendingEvaluation();
    if (!pending) return;
    this.callEvaluateHand(pending, { keepHand: false });
  }

  openSerumPowderSelection(): void {
    this.selectedCardsToBottom.set([]);
    this.phase.set('serum-powder');
  }

  cancelSerumPowder(): void {
    this.selectedCardsToBottom.set([]);
    this.phase.set('deciding');
  }

  toggleCardToBottom(index: number): void {
    const current = this.selectedCardsToBottom();
    if (current.includes(index)) {
      this.selectedCardsToBottom.set(current.filter(i => i !== index));
    } else if (current.length < this.requiredBottomCount()) {
      this.selectedCardsToBottom.set([...current, index]);
    }
  }

  isCardSelectedToBottom(index: number): boolean {
    return this.selectedCardsToBottom().includes(index);
  }

  confirmSerumPowder(): void {
    const pending = this.pendingEvaluation();
    if (!pending || !this.serumPowderConfirmEnabled()) return;
    this.callEvaluateHand(pending, {
      keepHand: false,
      activateSerumPowder: true,
      cardsToBottomIndices: this.selectedCardsToBottom(),
    });
  }

  // ── Navigation helpers ─────────────────────────────────────────────────────

  startNewSession(): void {
    this.resetSessionState();
    this.startSession();
  }

  viewStatistics(): void {
    this.router.navigate(['/decklists', this.decklistId(), 'mulligan-statistics']);
  }

  goBack(): void {
    this.location.back();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private callEvaluateHand(
    evaluation: HandEvaluationData,
    overrides: {
      keepHand: boolean;
      activateSerumPowder?: boolean;
      cardsToBottomIndices?: number[];
    }
  ): void {
    if (!this.sessionId()) return;
    this.phase.set('loading');
    this.mulliganService
      .evaluateHand({
        sessionId: this.sessionId()!,
        handNumber: this.handNumber(),
        canCastEtaliByTurn2: evaluation.canCastEtali,
        ...overrides,
      })
      .subscribe({
        next: (r: MulliganEvaluationResponse) => this.applyEvaluationResponse(r),
        error: (err) => this.handleError(err, 'Failed to submit evaluation'),
      });
  }

  private applyStartResponse(r: MulliganStartResponse): void {
    this.sessionId.set(r.sessionId);
    this.currentHand.set(r.currentHand);
    this.handNumber.set(r.handNumber);
    this.targetHandSize.set(r.targetHandSize);
    this.canMulligan.set(r.canMulligan);
    this.pendingEvaluation.set(null);
    this.selectedCardsToBottom.set([]);
    this.handKey.update(k => k + 1);
    this.phase.set('evaluating');
  }

  private applyEvaluationResponse(r: MulliganEvaluationResponse): void {
    if (r.sessionComplete) {
      this.startSession();
    } else {
      this.currentHand.set(r.nextHand);
      this.handNumber.set(r.nextHandNumber!);
      this.targetHandSize.set(r.nextTargetHandSize!);
      this.canMulligan.set(r.canMulligan);
      this.pendingEvaluation.set(null);
      this.selectedCardsToBottom.set([]);
      this.handKey.update(k => k + 1);
      this.phase.set('evaluating');
    }
  }

  private resetSessionState(): void {
    this.sessionId.set(null);
    this.currentHand.set(null);
    this.handNumber.set(1);
    this.targetHandSize.set(7);
    this.canMulligan.set(true);
    this.summary.set(null);
    this.pendingEvaluation.set(null);
    this.selectedCardsToBottom.set([]);
    this.handKey.set(0);
    this.phase.set('start');
  }

  private handleError(error: unknown, fallbackMessage: string): void {
    // Restore to evaluating so user can retry, unless there's no hand yet
    this.phase.set(this.currentHand() ? 'evaluating' : 'start');
    const httpErr = error as { status?: number; error?: { detail?: string } };
    let detail = fallbackMessage;
    if (httpErr?.status === 401) {
      detail = 'Your session has expired. Please log in again.';
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    } else if (httpErr?.status === 400 && httpErr?.error?.detail) {
      detail = httpErr.error.detail;
    } else if (httpErr?.status === 404) {
      detail = 'This decklist no longer exists.';
    }
    this.messageService.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
  }
}
