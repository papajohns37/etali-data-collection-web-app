import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DeckComparisonService } from '../../services/deck-comparison.service';
import { DecklistService } from '../../services/decklist.service';
import { Card } from '../../models/card.model';
import { DeckComparisonHand } from '../../models/comparison.model';
import { SharedHandEvaluationComponent, HandMetadata, HandEvaluationData } from '../shared-hand-evaluation/shared-hand-evaluation.component';

@Component({
  selector: 'app-comparison-hand-collection',
  standalone: true,
  imports: [
    CommonModule,
    SharedHandEvaluationComponent
  ],
  templateUrl: './comparison-hand-collection.component.html',
  styleUrl: './comparison-hand-collection.component.css'
})
export class ComparisonHandCollectionComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private comparisonService = inject(DeckComparisonService);
  private decklistService = inject(DecklistService);
  private messageService = inject(MessageService);

  comparisonId = signal<number>(0);
  currentHand = signal<Card[]>([]);
  originalHand = signal<Card[]>([]);
  currentHandData = signal<DeckComparisonHand | null>(null);
  isLoading = signal<boolean>(false);
  evaluationMessage = signal<string>('');
  
  // Hand metadata for shared component
  handMetadata = computed<HandMetadata>(() => {
    const data = this.currentHandData();
    if (!data) {
      return {
        seatOrder: 0,
        stickers: [],
        lowestGambleOdds: 0,
        decklistName: '',
        whichDeck: 1,
        generationAttempts: 0
      };
    }
    return {
      seatOrder: data.seatOrder,
      stickers: data.stickers,
      lowestGambleOdds: data.lowestGambleOdds,
      decklistName: data.decklistName,
      whichDeck: data.whichDeck,
      generationAttempts: data.generationAttempts
    };
  });
  
  // All cards in deck for library search
  allCards = computed(() => {
    const handData = this.currentHandData();
    if (!handData) return [];
    
    // Find the decklist by ID from the loaded decklists
    const decklist = this.decklistService.decklists().find(d => d.id === handData.decklistId);
    return decklist?.cards || [];
  });

  constructor() {
    // Load decklists first so we have access to all cards
    this.decklistService.loadDecklists().subscribe();
    
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) {
      this.comparisonId.set(id);
      this.onRequestHand();
    }
  }

  onRequestHand() {
    this.isLoading.set(true);
    this.evaluationMessage.set('');

    this.comparisonService.generateHand(this.comparisonId()).subscribe({
      next: (hand) => {
        this.currentHandData.set(hand);
        this.currentHand.set(hand.cards);
        this.originalHand.set([...hand.cards]);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to generate hand',
          life: 3000
        });
        console.error('Error generating hand:', error);
      }
    });
  }

  onSubmitEvaluation(evaluationData: HandEvaluationData) {
    const handData = this.currentHandData();
    if (!handData) return;

    this.isLoading.set(true);
    this.evaluationMessage.set('');

    this.comparisonService.submitEvaluation(
      this.comparisonId(),
      handData.whichDeck,
      handData.generationAttempts,
      {
        id: handData.id,
        cards: evaluationData.allCards,
        seatOrder: handData.seatOrder,
        stickers: handData.stickers,
        canCastEtali: evaluationData.canCastEtali,
        minimumCardsToCastEtali: evaluationData.minimumCardsToCastEtali,
        decklistId: handData.decklistId,
        decklistName: handData.decklistName,
        lowestGambleOdds: handData.lowestGambleOdds
      }
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.evaluationMessage.set('Evaluation submitted successfully!');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Hand evaluation submitted',
          life: 3000
        });
        setTimeout(() => this.onRequestHand(), 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.evaluationMessage.set('Failed to submit evaluation. Please try again.');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to submit evaluation',
          life: 3000
        });
        console.error('Error submitting evaluation:', error);
      }
    });
  }

  goBack() {
    this.location.back();
  }

  onHandChanged(newHand: Card[]) {
    this.currentHand.set(newHand);
  }
}
