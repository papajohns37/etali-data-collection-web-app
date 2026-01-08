import { Component, input, output, signal, computed, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragEnd } from '@angular/cdk/drag-drop';
import { BattlefieldLayoutService } from '../../services/battlefield-layout.service';
import { Card } from '../../models/card.model';
import { PercentagePipe } from '../../shared/pipes/percentage.pipe';
import { CachedImageDirective } from '../../shared/directives/cached-image.directive';
import { TIMING_CONSTANTS } from '../../shared/constants';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { inject } from '@angular/core';

export interface HandMetadata {
  seatOrder: number;
  stickers: number[];
  lowestGambleOdds: number;
  decklistName: string;
  whichDeck?: number; // For comparison mode
  generationAttempts?: number; // For comparison mode
}

export interface HandEvaluationData {
  canCastEtali: boolean;
  minimumCardsToCastEtali: number;
  cardsNeeded: number;
}

@Component({
  selector: 'app-shared-hand-evaluation',
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
    TooltipModule,
    ChipModule,
    PercentagePipe,
    CachedImageDirective
  ],
  templateUrl: './shared-hand-evaluation.component.html',
  styleUrl: './shared-hand-evaluation.component.css'
})
export class SharedHandEvaluationComponent {
  // Inputs
  hand = input.required<Card[]>();
  originalHand = input.required<Card[]>();
  metadata = input.required<HandMetadata>();
  allCards = input.required<Card[]>(); // All cards in deck for library search
  isLoading = input<boolean>(false);
  evaluationMessage = input<string>('');
  handId = input<number>(0);
  
  // Optional buttons config
  showStatisticsButton = input<boolean>(false);
  showLibrarySearch = input<boolean>(true);
  showResetButton = input<boolean>(true);
  showSkipButton = input<boolean>(false);
  
  // Labels customization
  backButtonLabel = input<string>('Back');
  submitButtonLabel = input<string>('Submit');
  
  // Outputs
  requestHand = output<void>();
  submitEvaluation = output<HandEvaluationData>();
  goBack = output<void>();
  viewStatistics = output<void>();
  handChanged = output<Card[]>();
  battlefieldChanged = output<{card: Card, x: number, y: number, tapped: boolean}[]>();

  // Internal state
  currentHand = signal<Card[]>([]);
  battlefield = signal<{card: Card, x: number, y: number, tapped: boolean}[]>([]);
  canCastEtali = signal<boolean>(false);
  minimumCardsToCastEtali = signal<number>(8);
  cardsNeeded = signal<number>(1);
  gambleCardsDrawn = signal<number>(0);
  
  // Library search modal state
  showLibraryModal = signal(false);
  searchQuery = signal('');
  
  // Signal-based DOM queries
  battlefieldZone = viewChild<ElementRef<HTMLDivElement>>('battlefieldZone');
  handZone = viewChild<ElementRef<HTMLDivElement>>('handZone');
  
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
  
  // Track the last hand ID to detect when we have a new hand
  private lastHandId: number = 0;
  
  private battlefieldLayout = inject(BattlefieldLayoutService);

  constructor() {
    // Sync hand input to internal state
    effect(() => {
      this.currentHand.set([...this.hand()]);
    });
    
    // Clear battlefield only when we get a new hand (handId changes)
    effect(() => {
      const currentHandId = this.handId();
      if (currentHandId !== this.lastHandId && currentHandId !== 0) {
        this.battlefield.set([]);
        this.canCastEtali.set(false);
        this.minimumCardsToCastEtali.set(8);
        this.cardsNeeded.set(1);
        this.lastHandId = currentHandId;
      }
    });
  }

  // Check if Gamble card is in hand
  hasGambleInHand = computed(() => {
    return this.currentHand().some(card => card.name.toLowerCase().includes('gamble'));
  });

  // Calculate current gamble odds
  currentGambleOdds = computed(() => {
    const cardsInHand = this.currentHand().length + this.gambleCardsDrawn();
    if (cardsInHand === 0) return 0;
    return (cardsInHand - this.cardsNeeded()) / cardsInHand;
  });

  // Check if gamble passes
  gamblePasses = computed(() => {
    return this.currentGambleOdds() >= this.metadata().lowestGambleOdds;
  });

  // Calculate minimum cards in hand where gamble still passes
  minCardsForGamblePass = computed(() => {
    const lowestGambleOdds = this.metadata().lowestGambleOdds;
    if (lowestGambleOdds === 0 || lowestGambleOdds >= 1) return 0;
    return Math.ceil(this.cardsNeeded() / (1 - lowestGambleOdds));
  });

  // Calculate minimum hand size that makes gamble pass
  minHandSizeForPass = computed(() => {
    return 7 - (this.currentHand().length + this.gambleCardsDrawn() - this.minCardsForGamblePass());
  });

  // Library cards (cards not in hand or battlefield)
  libraryCards = computed(() => {
    const allCards = this.allCards();
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

  onHandDrop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      this.currentHand.update(hand => {
        const newHand = [...hand];
        moveItemInArray(newHand, event.previousIndex, event.currentIndex);
        return newHand;
      });
      this.handChanged.emit(this.currentHand());
    }
  }

  onMouseDown(event: MouseEvent, cardElement: HTMLElement) {
    const rect = cardElement.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    this.mouseDownX = event.clientX;
    this.mouseDownY = event.clientY;
    this.isDragging = false;
  }
  
  onMouseMove(event: MouseEvent) {
    const distanceX = Math.abs(event.clientX - this.mouseDownX);
    const distanceY = Math.abs(event.clientY - this.mouseDownY);
    
    if (distanceX > 5 || distanceY > 5) {
      this.isDragging = true;
    }
  }
  
  onHandCardClick(card: Card, index: number) {
    if (this.isDragging) return;
    
    const battlefieldEl = this.battlefieldZone()?.nativeElement;
    if (!battlefieldEl) return;
    
    const rect = battlefieldEl.getBoundingClientRect();
    const cardDimensions = this.battlefieldLayout.calculateCardDimensions();
    const position = this.battlefieldLayout.findNextAvailablePosition(
      rect,
      this.battlefield(),
      cardDimensions
    );
    
    this.battlefield.update(bf => [...bf, { card, x: position.x, y: position.y, tapped: false }]);
    this.currentHand.update(hand => hand.filter((_, i) => i !== index));
    this.handChanged.emit(this.currentHand());
    this.battlefieldChanged.emit(this.battlefield());
  }
  
  onBattlefieldMouseDown(event: MouseEvent) {
    this.battlefieldMouseDownX = event.clientX;
    this.battlefieldMouseDownY = event.clientY;
    this.isBattlefieldDragging = false;
  }
  
  onBattlefieldMouseMove(event: MouseEvent) {
    const distanceX = Math.abs(event.clientX - this.battlefieldMouseDownX);
    const distanceY = Math.abs(event.clientY - this.battlefieldMouseDownY);
    
    if (distanceX > 5 || distanceY > 5) {
      this.isBattlefieldDragging = true;
    }
  }
  
  onBattlefieldCardClick(index: number) {
    if (this.isBattlefieldDragging) {
      return;
    }
    
    // Clear any existing timeout
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    
    // Wait to see if a double-click occurs
    this.clickTimeout = setTimeout(() => {
      const card = this.battlefield()[index].card;
      
      this.battlefield.update(bf => bf.filter((_, i) => i !== index));
      this.currentHand.update(hand => [...hand, card]);
      this.handChanged.emit(this.currentHand());
      this.battlefieldChanged.emit(this.battlefield());
      
      this.clickTimeout = null;
    }, TIMING_CONSTANTS.DOUBLE_CLICK_DELAY_MS);
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
    const battlefieldEl = this.battlefieldZone()?.nativeElement;
    if (!battlefieldEl) return;
    
    const rect = battlefieldEl.getBoundingClientRect();
    const dropPoint = event.dropPoint;
    
    if (dropPoint.x >= rect.left && dropPoint.x <= rect.right &&
        dropPoint.y >= rect.top && dropPoint.y <= rect.bottom) {
      const cardDimensions = this.battlefieldLayout.calculateCardDimensions();
      const position = this.battlefieldLayout.constrainToBounds(
        {
          x: dropPoint.x - rect.left - this.dragOffsetX,
          y: dropPoint.y - rect.top - this.dragOffsetY
        },
        rect,
        cardDimensions
      );
      
      this.battlefield.update(bf => [...bf, { card, x: position.x, y: position.y, tapped: false }]);
      this.currentHand.update(hand => hand.filter((_, i) => i !== index));
      this.handChanged.emit(this.currentHand());
      this.battlefieldChanged.emit(this.battlefield());
    }
  }

  onBattlefieldCardDragEnded(event: CdkDragEnd, index: number) {
    const dropPoint = event.dropPoint;
    const battlefieldEl = this.battlefieldZone()?.nativeElement;
    const handEl = this.handZone()?.nativeElement;
    
    const originalX = this.battlefield()[index].x;
    const originalY = this.battlefield()[index].y;
    
    // Check if card was dropped back on hand zone
    if (handEl) {
      const handRect = handEl.getBoundingClientRect();
      
      if (dropPoint.x >= handRect.left && dropPoint.x <= handRect.right &&
          dropPoint.y >= handRect.top && dropPoint.y <= handRect.bottom) {
        const cardData = this.battlefield()[index];
        this.currentHand.update(hand => [...hand, cardData.card]);
        this.battlefield.update(bf => bf.filter((_, i) => i !== index));
        this.handChanged.emit(this.currentHand());
        this.battlefieldChanged.emit(this.battlefield());
        return;
      }
    }
    
    // Calculate new position and constrain to battlefield bounds
    if (battlefieldEl) {
      const battlefieldRect = battlefieldEl.getBoundingClientRect();
      const cardDimensions = this.battlefieldLayout.calculateCardDimensions();
      const newPosition = this.battlefieldLayout.calculateDragPosition(
        { x: originalX, y: originalY },
        event.distance,
        battlefieldRect,
        cardDimensions
      );
      
      this.battlefield.update(bf => {
        const newBf = [...bf];
        newBf[index] = { ...newBf[index], x: newPosition.x, y: newPosition.y };
        return newBf;
      });
      
      this.battlefieldChanged.emit(this.battlefield());
      event.source.reset();
    }
  }

  onCanCastEtaliChange() {
    if (this.canCastEtali()) {
      // Set minimum cards to 7 - number of cards in hand
      this.minimumCardsToCastEtali.set(7 - this.currentHand().length);
    }
  }

  onSubmitEvaluationClick() {
    this.submitEvaluation.emit({
      canCastEtali: this.canCastEtali(),
      minimumCardsToCastEtali: this.canCastEtali() ? this.minimumCardsToCastEtali() : 8,
      cardsNeeded: this.cardsNeeded()
    });
  }

  toggleTap(index: number) {
    this.battlefield.update(bf => {
      const newBf = [...bf];
      newBf[index] = { ...newBf[index], tapped: !newBf[index].tapped };
      return newBf;
    });
    this.battlefieldChanged.emit(this.battlefield());
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
    this.canCastEtali.set(false);
    this.minimumCardsToCastEtali.set(8);
    this.cardsNeeded.set(1);
    
    this.handChanged.emit(this.currentHand());
    this.battlefieldChanged.emit(this.battlefield());
  }

  onAddCardToHand(card: Card) {
    this.currentHand.update(hand => [...hand, card]);
    this.handChanged.emit(this.currentHand());
    this.closeLibraryModal();
  }

  getDeckBadgeClass(): string {
    const whichDeck = this.metadata().whichDeck;
    return whichDeck === 1 ? 'deck-1-badge' : 'deck-2-badge';
  }
}
