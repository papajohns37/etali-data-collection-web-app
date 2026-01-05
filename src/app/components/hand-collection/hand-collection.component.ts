import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DecklistService } from '../../services/decklist.service';
import { Card } from '../../models/card.model';
import { TIMING_CONSTANTS } from '../../shared/constants';
import { SharedHandEvaluationComponent, HandMetadata, HandEvaluationData } from '../shared-hand-evaluation/shared-hand-evaluation.component';

@Component({
  selector: 'app-hand-collection',
  standalone: true,
  imports: [
    CommonModule,
    SharedHandEvaluationComponent
  ],
  templateUrl: './hand-collection.component.html',
  styleUrl: './hand-collection.component.css'
})
export class HandCollectionComponent {
  currentHand = signal<Card[]>([]);
  originalHand = signal<Card[]>([]);
  currentHandId = signal<number>(0);
  isLoading = signal<boolean>(false);
  evaluationMessage = signal<string>('');
  
  // Hand metadata
  handMetadata = signal<HandMetadata>({
    seatOrder: 0,
    stickers: [],
    lowestGambleOdds: 0,
    decklistName: ''
  });
  
  private decklistService = inject(DecklistService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private location = inject(Location);

  constructor() {
    // Automatically request a hand when component loads
    this.onRequestHand();
  }

  get selectedDecklist() {
    return this.decklistService.selectedDecklist();
  }

  // All cards in deck for library search
  allCards = computed(() => {
    return this.decklistService.selectedDecklist()?.cards || [];
  });

  onRequestHand() {
    const selectedDecklist = this.decklistService.selectedDecklist();
    
    if (!selectedDecklist) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No Decklist Selected',
        detail: 'Please select a decklist first',
        life: 3000,
      });
      this.router.navigate(['/decklists']);
      return;
    }
    
    this.isLoading.set(true);
    this.evaluationMessage.set('');
    
    this.decklistService.getRandomHand(selectedDecklist.name).subscribe({
      next: (response) => {
        this.currentHandId.set(response.id);
        this.currentHand.set(response.cards);
        this.originalHand.set([...response.cards]);
        
        // Update metadata
        this.handMetadata.set({
          seatOrder: response.seatOrder,
          stickers: response.stickers,
          lowestGambleOdds: response.lowestGambleOdds,
          decklistName: response.decklistName
        });
        
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSubmitEvaluation(evaluationData: HandEvaluationData) {
    const selectedDecklist = this.decklistService.selectedDecklist();
    if (!selectedDecklist) return;

    const payload = {
      id: this.currentHandId(),
      cards: this.currentHand(),
      seatOrder: this.handMetadata().seatOrder,
      stickers: this.handMetadata().stickers,
      lowestGambleOdds: this.handMetadata().lowestGambleOdds,
      canCastEtali: evaluationData.canCastEtali,
      minimumCardsToCastEtali: evaluationData.minimumCardsToCastEtali,
      decklistId: selectedDecklist.id,
      decklistName: selectedDecklist.name
    };

    this.isLoading.set(true);
    this.decklistService.submitHandEvaluation(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Hand evaluation submitted successfully!',
          life: TIMING_CONSTANTS.TOAST_LIFE_MS,
        });
        this.evaluationMessage.set('');
        this.isLoading.set(false);
        setTimeout(() => this.onRequestHand(), TIMING_CONSTANTS.SUCCESS_MESSAGE_DELAY_MS);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goBackToDecklists() {
    this.location.back();
  }

  viewStatistics() {
    const selectedDecklist = this.decklistService.selectedDecklist();
    if (selectedDecklist) {
      this.router.navigate(['/decklists', selectedDecklist.id, 'statistics']);
    }
  }

  onHandChanged(newHand: Card[]) {
    this.currentHand.set(newHand);
  }
}
