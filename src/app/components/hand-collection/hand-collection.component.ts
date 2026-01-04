import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { DecklistService } from '../../services/decklist.service';
import { Card } from '../../models/card.model';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-hand-collection',
  standalone: true,
  imports: [
    DragDropModule, 
    CommonModule, 
    CdkDrag, 
    CdkDropList, 
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TooltipModule
  ],
  templateUrl: './hand-collection.component.html',
  styleUrl: './hand-collection.component.css'
})
export class HandCollectionComponent {
  protected readonly title = signal('mtg-data');
  currentHand = signal<Card[]>([]);
  originalHand = signal<Card[]>([]); // Store original hand for reset
  battlefield = signal<{card: Card, x: number, y: number, tapped: boolean}[]>([]);
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
  
  // Track drag offset for accurate card placement
  private dragOffsetX: number = 0;
  private dragOffsetY: number = 0;
  
  // Track mouse position to differentiate click from drag
  private mouseDownX: number = 0;
  private mouseDownY: number = 0;
  private isDragging: boolean = false;
  
  // Track battlefield card drag separately
  private battlefieldMouseDownX: number = 0;
  private battlefieldMouseDownY: number = 0;
  private isBattlefieldDragging: boolean = false;
  
  // Track pending click to distinguish single from double click
  private clickTimeout: any = null;
  
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
    return this.currentHand().some(card => card.name.toLowerCase().includes('gamble'));
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
    if (!decklist || !decklist.cards) return [];
    
    const allCards = decklist.cards;
    const inHand = new Set(this.currentHand().map(c => c.name));
    const onBattlefield = new Set(this.battlefield().map(c => c.card.name));
    
    return allCards.filter(card => 
      !inHand.has(card.name) && !onBattlefield.has(card.name)
    );
  });

  // Filtered library cards based on search query
  filteredLibraryCards = computed(() => {
    const cards = this.libraryCards();
    const query = this.searchQuery().toLowerCase();
    
    let filtered = query ? cards.filter(card => card.name.toLowerCase().includes(query)) : cards;
    
    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  });

  onRequestHand() {
    const selectedDecklist = this.decklistService.selectedDecklist();
    
    if (!selectedDecklist) {
      this.evaluationMessage = 'Please select a decklist first';
      this.router.navigate(['/decklists']);
      return;
    }
    
    this.isLoading = true;
    this.evaluationMessage = '';
    
    this.decklistService.getRandomHand(selectedDecklist.name).subscribe({
      next: (response) => {
        this.currentHandId = response.id;
        this.currentHand.set(response.cards);
        this.originalHand.set([...response.cards]); // Store original hand for reset
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

  onHandDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      this.currentHand.update(hand => {
        const newHand = [...hand];
        moveItemInArray(newHand, event.previousIndex, event.currentIndex);
        return newHand;
      });
    }
  }

  onMouseDown(event: MouseEvent, cardElement: HTMLElement) {
    // Capture the card position and mouse position BEFORE CDK modifies anything
    const rect = cardElement.getBoundingClientRect();
    
    // Calculate offset from top-left corner of card to cursor position
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    
    // Track initial mouse position for drag detection
    this.mouseDownX = event.clientX;
    this.mouseDownY = event.clientY;
    this.isDragging = false;
  }
  
  onMouseMove(event: MouseEvent) {
    // Detect if user is dragging (moved more than 5px)
    const distanceX = Math.abs(event.clientX - this.mouseDownX);
    const distanceY = Math.abs(event.clientY - this.mouseDownY);
    
    if (distanceX > 5 || distanceY > 5) {
      this.isDragging = true;
    }
  }
  
  private calculateCardDimensions(): { width: number, height: number } {
    // Get actual computed card width from the CSS variable
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = Math.min(viewportWidth * 0.09, viewportHeight * 0.15);
    const cardHeight = cardWidth * 1.4; // MTG card aspect ratio
    
    return { width: cardWidth, height: cardHeight };
  }
  
  onHandCardClick(card: Card, index: number) {
    // Only place card if this was a click, not a drag
    if (this.isDragging) {
      return;
    }
    
    const battlefieldZone = document.querySelector('.battlefield-zone');
    if (!battlefieldZone) return;
    
    const rect = battlefieldZone.getBoundingClientRect();
    const { width: cardWidth, height: cardHeight } = this.calculateCardDimensions();
    const gap = 10; // Fixed gap between cards
    
    // Find the next available position (bottom-left, filling left-to-right, wrapping up)
    let x = 0;
    let y = rect.height - cardHeight;
    
    // Check each potential position for overlap with existing cards
    const battlefield = this.battlefield();
    let positionFound = false;
    
    while (!positionFound && y >= 0) {
      // Try positions left-to-right in current row
      while (x + cardWidth <= rect.width) {
        // Check if this position overlaps with any existing card
        const overlaps = battlefield.some(existingCard => {
          const overlapX = x < existingCard.x + cardWidth && x + cardWidth > existingCard.x;
          const overlapY = y < existingCard.y + cardHeight && y + cardHeight > existingCard.y;
          return overlapX && overlapY;
        });
        
        if (!overlaps) {
          positionFound = true;
          break;
        }
        
        x += cardWidth + gap;
      }
      
      if (!positionFound) {
        // Move to next row up
        x = 0;
        y -= cardHeight + gap;
      }
    }
    
    // Constrain within bounds
    const constrainedX = Math.max(0, Math.min(x, rect.width - cardWidth));
    const constrainedY = Math.max(0, Math.min(y, rect.height - cardHeight));
    
    // Add card to battlefield and remove from hand
    this.battlefield.update(bf => [...bf, { card, x: constrainedX, y: constrainedY, tapped: false }]);
    this.currentHand.update(hand => hand.filter((_, i) => i !== index));
  }
  
  onBattlefieldMouseDown(event: MouseEvent) {
    // Track initial mouse position for drag detection
    this.battlefieldMouseDownX = event.clientX;
    this.battlefieldMouseDownY = event.clientY;
    this.isBattlefieldDragging = false;
  }
  
  onBattlefieldMouseMove(event: MouseEvent) {
    // Detect if user is dragging (moved more than 5px)
    const distanceX = Math.abs(event.clientX - this.battlefieldMouseDownX);
    const distanceY = Math.abs(event.clientY - this.battlefieldMouseDownY);
    
    if (distanceX > 5 || distanceY > 5) {
      this.isBattlefieldDragging = true;
    }
  }
  
  onBattlefieldCardClick(index: number) {
    // Only process click if this was not a drag
    if (this.isBattlefieldDragging) {
      return;
    }
    
    // Clear any existing timeout
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    
    // Wait to see if a double-click occurs
    this.clickTimeout = setTimeout(() => {
      const battlefield = this.battlefield();
      const card = battlefield[index].card;
      
      // Remove from battlefield and add back to hand
      this.battlefield.update(bf => bf.filter((_, i) => i !== index));
      this.currentHand.update(hand => [...hand, card]);
      
      this.clickTimeout = null;
    }, 250); // 250ms delay to detect double-click
  }
  
  onBattlefieldCardDoubleClick(index: number) {
    // Cancel the pending single-click action
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
      this.clickTimeout = null;
    }
    
    // Execute tap action
    this.toggleTap(index);
  }

  onHandCardDragEnded(event: CdkDragEnd, card: Card, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldZone = document.querySelector('.battlefield-zone');
    
    if (battlefieldZone) {
      const rect = battlefieldZone.getBoundingClientRect();
      
      if (dropPoint.x >= rect.left && dropPoint.x <= rect.right &&
          dropPoint.y >= rect.top && dropPoint.y <= rect.bottom) {
        // Get card dimensions
        const { width: cardWidth, height: cardHeight } = this.calculateCardDimensions();
        
        // Calculate position using the stored drag offset to maintain cursor position
        const x = dropPoint.x - rect.left - this.dragOffsetX;
        const y = dropPoint.y - rect.top - this.dragOffsetY;
        
        // Constrain within bounds
        const constrainedX = Math.max(0, Math.min(x, rect.width - cardWidth));
        const constrainedY = Math.max(0, Math.min(y, rect.height - cardHeight));
        
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

  onCanCastEtaliChange() {
    if (this.canCastEtali) {
      // Set minimum cards to 7 - number of cards in hand
      this.minimumCardsToCastEtali = 7 - this.currentHand().length;
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

  viewStatistics() {
    const selectedDecklist = this.decklistService.selectedDecklist();
    if (selectedDecklist) {
      this.router.navigate(['/decklists', selectedDecklist.id, 'statistics']);
    }
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
  
  resetHand() {
    // Clear the battlefield
    this.battlefield.set([]);
    
    // Restore hand to original state
    this.currentHand.set([...this.originalHand()]);
    
    // Reset other state
    this.canCastEtali = false;
    this.minimumCardsToCastEtali = 8;
    this.cardsNeeded.set(1);
  }

  onAddCardToHand(card: Card) {
    this.currentHand.update(hand => [...hand, card]);
    // Card will be automatically filtered from library on next render due to computed signal
    this.closeLibraryModal();
  }
}
