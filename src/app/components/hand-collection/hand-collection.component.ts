import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DecklistService } from '../../services/decklist.service';

@Component({
  selector: 'app-hand-collection',
  standalone: true,
  imports: [DragDropModule, CommonModule, CdkDrag, CdkDropList, FormsModule],
  templateUrl: './hand-collection.component.html',
  styleUrl: './hand-collection.component.css'
})
export class HandCollectionComponent {
  protected readonly title = signal('mtg-data');
  currentHand = signal<string[]>([]);
  battlefield = signal<{card: string, x: number, y: number, tapped: boolean}[]>([]);
  currentHandId: number = 0;
  currentDecklistId: number = 0;
  currentDecklistName: string = '';
  seatOrder: number = 0;
  stickers: number[] = [];
  lowestGambleOdds: number = 0;
  canCastEtali: boolean = false;
  minimumCardsToCastEtali: number = 8;
  isLoading: boolean = false;
  evaluationMessage: string = '';
  
  // Gamble odds calculation
  cardsNeeded = signal<number>(1);
  
  // Library search modal state
  showLibraryModal = signal(false);
  searchQuery = signal('');
  
  private decklistService = inject(DecklistService);
  private router = inject(Router);

  constructor() {
    // Automatically request a hand when component loads
    this.onRequestHand();
  }

  get selectedDecklist() {
    return this.decklistService.selectedDecklist();
  }

  // Check if Gamble card is in hand
  hasGambleInHand = computed(() => {
    return this.currentHand().some(card => card.toLowerCase().includes('gamble'));
  });

  // Calculate current gamble odds (cards needed / cards in hand)
  currentGambleOdds = computed(() => {
    const cardsInHand = this.currentHand().length;
    if (cardsInHand === 0) return 0;
    return (cardsInHand - this.cardsNeeded()) / cardsInHand;
  });

  // Check if gamble passes (current odds >= lowest odds)
  gamblePasses = computed(() => {
    return this.currentGambleOdds() >= this.lowestGambleOdds;
  });

  // Calculate minimum cards in hand where gamble still passes
  minCardsForGamblePass = computed(() => {
    if (this.lowestGambleOdds === 0 || this.lowestGambleOdds >= 1) return 0;
    // Find smallest N where (N - cardsNeeded) / N >= lowestGambleOdds
    // Rearranging: N >= cardsNeeded / (1 - lowestGambleOdds)
    return Math.ceil(this.cardsNeeded() / (1 - this.lowestGambleOdds));
  });

  // Calculate minimum hand size that makes gamble pass
  minHandSizeForPass = computed(() => {
    return 7 - (this.currentHand().length - this.minCardsForGamblePass());
  });

  // Format percentage for display
  formatPercentage(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  // Computed signal for library cards (cards not in hand or battlefield)
  libraryCards = computed(() => {
    const decklist = this.decklistService.selectedDecklist();
    if (!decklist) return [];
    
    const allCards = decklist.cardNames;
    const inHand = new Set(this.currentHand());
    const onBattlefield = new Set(this.battlefield().map(c => c.card));
    
    return allCards.filter(card => 
      !inHand.has(card) && !onBattlefield.has(card)
    );
  });

  // Filtered library cards based on search query
  filteredLibraryCards = computed(() => {
    const cards = this.libraryCards();
    const query = this.searchQuery().toLowerCase();
    
    let filtered = query ? cards.filter(card => card.toLowerCase().includes(query)) : cards;
    
    // Sort alphabetically
    return filtered.sort((a, b) => a.localeCompare(b));
  });

  onRequestHand() {
    const selectedDecklist = this.decklistService.selectedDecklist();
    
    if (!selectedDecklist) {
      this.evaluationMessage = 'Please select a decklist first';
      this.router.navigate(['/decklists']);
      return;
    }
    
    console.log('Requesting hand from server. Currently selected decklist:', selectedDecklist.name);
    
    this.isLoading = true;
    this.evaluationMessage = '';
    
    this.decklistService.getRandomHand(selectedDecklist.name).subscribe({
      next: (response) => {
        this.currentHandId = response.id;
        this.currentHand.set(response.cards);
        this.seatOrder = response.seatOrder;
        this.stickers = response.stickers;
        this.lowestGambleOdds = response.lowestGambleOdds;
        this.currentDecklistId = response.decklistId;
        this.currentDecklistName = response.decklistName;
        this.battlefield.set([]);
        this.canCastEtali = false;
        this.minimumCardsToCastEtali = 8;
        this.cardsNeeded.set(1);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to fetch hand:', err);
        if (err.status === 404) {
          this.evaluationMessage = `Decklist "${selectedDecklist.name}" not found`;
        } else if (err.error?.error) {
          this.evaluationMessage = err.error.error;
        } else {
          this.evaluationMessage = 'Failed to fetch hand from server';
        }
        this.isLoading = false;
      }
    });
  }

  getImageUrl(cardName: string): string {
    const formattedName = cardName.replace(/ /g, '+').replace(/'/g, '%27').replace(/,/g, '%2C');
    return `https://api.scryfall.com/cards/named?exact=${formattedName}&format=image`;
  }

  onHandDrop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      this.currentHand.update(hand => {
        const newHand = [...hand];
        moveItemInArray(newHand, event.previousIndex, event.currentIndex);
        return newHand;
      });
    }
  }

  onHandCardDragEnded(event: CdkDragEnd, card: string, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    
    if (battlefieldZone) {
      const rect = battlefieldZone.getBoundingClientRect();
      
      if (dropPoint.x >= rect.left && dropPoint.x <= rect.right &&
          dropPoint.y >= rect.top && dropPoint.y <= rect.bottom) {
        // Calculate position relative to battlefield, centering the card
        const x = dropPoint.x - rect.left - 100; // 100 = card width / 2
        const y = dropPoint.y - rect.top - 15;
        
        // Constrain within bounds
        const constrainedX = Math.max(0, Math.min(x, rect.width - 200));
        const constrainedY = Math.max(0, Math.min(y, rect.height - 280));
        
        this.battlefield.update(bf => [...bf, { card, x: constrainedX, y: constrainedY, tapped: false }]);
        this.currentHand.update(hand => hand.filter((_, i) => i !== index));
      }
    }
  }

  onBattlefieldCardDragEnded(event: CdkDragEnd, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    const handZone = document.querySelector('.hand-zone');
    
    // Store original position for potential reset
    const originalX = this.battlefield()[index].x;
    const originalY = this.battlefield()[index].y;
    
    // Check if card was dropped back on hand zone
    if (handZone) {
      const handRect = handZone.getBoundingClientRect();
      
      if (dropPoint.x >= handRect.left && dropPoint.x <= handRect.right &&
          dropPoint.y >= handRect.top && dropPoint.y <= handRect.bottom) {
        const cardData = this.battlefield()[index];
        this.currentHand.update(hand => [...hand, cardData.card]);
        this.battlefield.update(bf => bf.filter((_, i) => i !== index));
        return;
      }
    }
    
    // Calculate new position and constrain to battlefield bounds
    if (battlefieldZone) {
      const battlefieldRect = battlefieldZone.getBoundingClientRect();
      const distance = event.distance;
      
      // Calculate new position based on original position plus drag distance
      let newX = originalX + distance.x;
      let newY = originalY + distance.y;
      
      // Get card width dynamically from CSS variable
      const cardWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-width')) || 120;
      const cardHeight = cardWidth * 1.4; // MTG card aspect ratio
      
      // Constrain position to battlefield bounds (snap to nearest valid position)
      newX = Math.max(0, Math.min(newX, battlefieldRect.width - cardWidth));
      newY = Math.max(0, Math.min(newY, battlefieldRect.height - cardHeight));
      
      // Update to constrained position
      this.battlefield.update(bf => {
        const newBf = [...bf];
        newBf[index] = { ...newBf[index], x: newX, y: newY };
        return newBf;
      });
      
      // Reset the drag position to prevent double-transform
      event.source.reset();
    }
  }

  onSubmitEvaluation() {
    const payload = {
      id: this.currentHandId,
      cards: this.currentHand(),
      seatOrder: this.seatOrder,
      stickers: this.stickers,
      lowestGambleOdds: this.lowestGambleOdds,
      canCastEtali: this.canCastEtali,
      minimumCardsToCastEtali: this.canCastEtali ? this.minimumCardsToCastEtali : 8,
      decklistId: this.currentDecklistId,
      decklistName: this.currentDecklistName
    };

    this.isLoading = true;
    this.decklistService.submitHandEvaluation(payload).subscribe({
      next: (response) => {
        this.evaluationMessage = 'Hand evaluation submitted successfully!';
        this.isLoading = false;
        // Automatically request a new hand after brief delay
        setTimeout(() => {
          this.evaluationMessage = '';
          this.onRequestHand();
        }, 1500);
      },
      error: (err) => {
        console.error('Failed to submit evaluation:', err);
        this.evaluationMessage = 'Failed to submit evaluation. Please try again.';
        this.isLoading = false;
      }
    });
  }

  toggleTap(index: number) {
    this.battlefield.update(bf => {
      const newBf = [...bf];
      newBf[index] = { ...newBf[index], tapped: !newBf[index].tapped };
      return newBf;
    });
  }

  goBackToDecklists() {
    this.router.navigate(['/decklists']);
  }

  // Library search modal methods
  openLibraryModal() {
    this.showLibraryModal.set(true);
    this.searchQuery.set('');
  }

  closeLibraryModal() {
    this.showLibraryModal.set(false);
    this.searchQuery.set('');
  }

  onAddCardToHand(cardName: string) {
    this.currentHand.update(hand => [...hand, cardName]);
    // Card will be automatically filtered from library on next render due to computed signal
    this.closeLibraryModal();
  }
}
