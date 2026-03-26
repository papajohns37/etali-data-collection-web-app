import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Card } from '../../models/card.model';
import { Decklist } from '../../models/decklist.model';
import { MaximumManaHandEvaluation } from '../../models/hand.model';
import { TIMING_CONSTANTS } from '../../shared/constants';
import {
  HandEvaluationData,
  HandMetadata,
  SharedHandEvaluationComponent,
} from '../shared-hand-evaluation/shared-hand-evaluation.component';
import { DecklistService } from '../../services/decklist.service';

@Component({
  selector: 'app-maximum-mana-hand-collection',
  standalone: true,
  imports: [CommonModule, SharedHandEvaluationComponent],
  templateUrl: './maximum-mana-hand-collection.component.html',
  styleUrl: './maximum-mana-hand-collection.component.css',
})
export class MaximumManaHandCollectionComponent {
  currentHand = signal<Card[]>([]);
  originalHand = signal<Card[]>([]);
  currentHandId = signal<number>(0);
  isLoading = signal<boolean>(false);
  evaluationMessage = signal<string>('');
  selectedDecklist = signal<Decklist | null>(null);

  handMetadata = signal<HandMetadata>({
    seatOrder: 0,
    stickers: [],
    lowestGambleOdds: 0,
    decklistName: '',
  });

  private decklistService = inject(DecklistService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  allCards = computed(() => this.selectedDecklist()?.cards ?? []);

  constructor() {
    const decklistId = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isNaN(decklistId) || decklistId <= 0) {
      this.router.navigate(['/decklists']);
      return;
    }

    this.initializeDecklist(decklistId);
  }

  private initializeDecklist(decklistId: number) {
    const existingDecklist = this.decklistService.decklists().find(d => d.id === decklistId);
    if (existingDecklist) {
      this.selectedDecklist.set(existingDecklist);
      this.onRequestHand();
      return;
    }

    this.decklistService.loadDecklists().subscribe({
      next: () => {
        const loadedDecklist = this.decklistService.decklists().find(d => d.id === decklistId) ?? null;
        if (!loadedDecklist) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Decklist Not Found',
            detail: 'Please select a valid decklist',
            life: 3000,
          });
          this.router.navigate(['/decklists']);
          return;
        }

        this.selectedDecklist.set(loadedDecklist);
        this.onRequestHand();
      },
      error: () => {
        this.router.navigate(['/decklists']);
      },
    });
  }

  onRequestHand() {
    const decklist = this.selectedDecklist();
    if (!decklist) {
      return;
    }

    this.isLoading.set(true);
    this.evaluationMessage.set('');

    this.decklistService.getMaximumManaHand(decklist.name).subscribe({
      next: response => {
        this.currentHandId.set(response.id);
        this.currentHand.set(response.cards);
        this.originalHand.set([...response.cards]);

        this.handMetadata.set({
          seatOrder: response.seatOrder,
          stickers: response.stickers,
          lowestGambleOdds: response.lowestGambleOdds,
          decklistName: response.decklistName,
        });

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmitEvaluation(evaluationData: HandEvaluationData) {
    const decklist = this.selectedDecklist();
    if (!decklist) return;

    const payload: MaximumManaHandEvaluation = {
      id: this.currentHandId(),
      cards: evaluationData.allCards,
      seatOrder: this.handMetadata().seatOrder,
      stickers: this.handMetadata().stickers,
      lowestGambleOdds: this.handMetadata().lowestGambleOdds,
      decklistId: decklist.id,
      decklistName: decklist.name,
      maximumManaIn7CardHand: evaluationData.maximumManaIn7CardHand ?? 0,
      maximumManaIn6CardHand: evaluationData.maximumManaIn6CardHand ?? 0,
      maximumManaIn5CardHand: evaluationData.maximumManaIn5CardHand ?? 0,
      maximumManaIn4CardHand: evaluationData.maximumManaIn4CardHand ?? 0,
      maximumManaIn3CardHand: evaluationData.maximumManaIn3CardHand ?? 0,
    };

    this.isLoading.set(true);
    this.decklistService.submitMaximumManaHandEvaluation(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Maximum mana hand evaluation submitted successfully!',
          life: TIMING_CONSTANTS.TOAST_LIFE_MS,
        });
        this.evaluationMessage.set('');
        this.isLoading.set(false);
        setTimeout(() => this.onRequestHand(), TIMING_CONSTANTS.SUCCESS_MESSAGE_DELAY_MS);
      },
      error: () => this.isLoading.set(false),
    });
  }

  goBackToDecklists() {
    this.location.back();
  }

  onHandChanged(newHand: Card[]) {
    this.currentHand.set(newHand);
  }
}
